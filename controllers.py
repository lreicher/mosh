"""
This file defines actions, i.e. functions the URLs are mapped into
The @action(path) decorator exposed the function at URL:

    http://127.0.0.1:8000/{app_name}/{path}

If app_name == '_default' then simply

    http://127.0.0.1:8000/{path}

If path == 'index' it can be omitted:

    http://127.0.0.1:8000/

The path follows the bottlepy syntax.

@action.uses('generic.html')  indicates that the action uses the generic.html template
@action.uses(session)         indicates that the action uses the session
@action.uses(db)              indicates that the action uses the db
@action.uses(T)               indicates that the action uses the i18n & pluralization
@action.uses(auth.user)       indicates that the action requires a logged in user
@action.uses(auth)            indicates that the action requires the auth object

session, db, T, auth, and tempates are examples of Fixtures.
Warning: Fixtures MUST be declared with @action.uses({fixtures}) else your app will result in undefined behavior
"""
import datetime
import collections as ct

from py4web import action, request, abort, redirect, URL, response
from yatl.helpers import A
from .common import db, session, T, cache, auth, logger, authenticated, unauthenticated, flash
from py4web.utils.url_signer import URLSigner
from .models import get_user_email, get_user
from py4web.utils.form import Form, FormStyleBulma
from .common import Field

url_signer = URLSigner(session)

@action('index')
@action.uses('index.html', db, auth.user, url_signer)
def index():
    return dict(
        # COMPLETE: return here any signed URLs you need.
        load_feed_url=URL('load_feed', signer=url_signer),
        load_myevents_url=URL('myevents', signer=url_signer),
        add_event_url=URL('add', signer=url_signer),
        edit_event_url=URL('edit', signer=url_signer),
        delete_event_url=URL('delete', signer=url_signer),
        load_attendees_url=URL('attendees', signer=url_signer),
        set_attending_url=URL('attend', signer=url_signer),
        send_message_url=URL('message', signer=url_signer),
        load_messages_url=URL('load_messages', signer=url_signer),
        load_conversations_url=URL('load_conversations', signer=url_signer),
        start_conversation_url=URL('start_conversation', signer=url_signer),
        my_callback_url = URL('my_callback', signer=url_signer),
    )

@action('load_feed')
@action.uses(url_signer.verify(), db, auth.user)
def load_feed():
    user_email = get_user_email()
    events = db(db.event).select(orderby=db.event.date | db.event.time)
    attending = db(
        (db.attendees.user_id == auth.user_id) &
        (db.event.id == db.attendees.event_id)
    ).select(db.attendees.event_id).as_list()


    conversations = db(
        ((db.conversation.host_id == get_user()) | (db.conversation.user_id == get_user()))
    ).select().as_list()
    #print("CONVOS: ", conversations)


    return dict(events=events, attending=attending, user_email=user_email, conversations=conversations)


@action('myevents')
@action.uses('myevents.html', url_signer, db, auth.user)
def myevents():
    rows = db(db.event.created_by == get_user_email()).select()
    attending = db(
         (db.attendees.user_id == auth.user_id) &
         (db.event.id == db.attendees.event_id)
     ).select(db.event.id, db.event.host, db.event.event_name, db.event.location, db.event.price)
    return dict(rows=rows, attending=attending, url_signer=url_signer)

@action('add', method="POST")
@action.uses(url_signer.verify(), db, session, auth.user)
def add():
    id = db.event.insert(
        host=request.json.get('event_host'),
        event_name=request.json.get('event_name'),
        location=request.json.get('event_location'),
        description=request.json.get('event_description'),
        price=request.json.get('event_price'),
        date=request.json.get('event_date'),
        time=request.json.get('event_time'),
    )
    event = db.event[id]
    return dict(event=event)

# This endpoint will be used for URLs of the form /edit/k where k is the event id.
@action('edit/<event_id:int>', method=["GET", "POST"])
@action.uses('edit.html', db, session, auth.user)
def edit(event_id=None):
    assert event_id is not None
    # We read the product being edited from the db.
    # p = db(db.product.id == product_id).select().first()
    event = db.event[event_id]
    if event is None or not (event.created_by == get_user_email()):
        # Nothing found to be edited!
        redirect(URL('index'))
    # Edit form: it has record=
    form = Form(db.event, record=event, deletable=False, csrf_session=session, formstyle=FormStyleBulma)
    if form.accepted:
        # The update already happened!
        redirect(URL('index'))
    return dict(form=form)

@action('delete')
@action.uses(db, session, auth.user, url_signer.verify())
def delete():
    event_id = request.params.get('id')
    assert event_id is not None
    event = db.event[event_id]
    assert event.created_by == get_user_email()
    db(db.event.id == event_id).delete()
    return "ok"

@action('attendees/<event_id:int>')
@action.uses('attendees.html', db, session, auth.user)
def attendees(event_id=None):
    assert event_id is not None
    event = db.event[event_id]
    if event is None or not (event.created_by == get_user_email()):
        redirect(URL('index'))
    rows = db(
        (db.attendees.event_id == event_id) &
        (db.auth_user.id == db.attendees.user_id)
    ).select(db.auth_user.first_name, db.auth_user.last_name)
    return dict(rows=rows, event=event)

@action('attend', method="POST")
@action.uses(url_signer.verify(), db, session, auth.user)
def attend():
    event_id = request.json.get('event_id')
    status = request.json.get('status')
    assert event_id is not None and status is not None
    db.attendees.update_or_insert(
        ((db.attendees.event_id == event_id) & (db.attendees.user_id == get_user())),
        event_id=event_id,
        user_id=get_user(),
        attending=status,
    )
    return "ok"


@action('start_conversation', method="POST")
@action.uses(db, session, auth.user, url_signer.verify())
def start_conversation():
    event_id = request.json.get('event_id')
    
    user = get_user()
    e = db.event[event_id]
    assert e is not None
    # host id:
    host = db(db.auth_user.email == e.created_by).select(db.auth_user.id).first()
    # get row for host 
    hr = db(db.auth_user.id == host).select().first()
    host_name = hr.first_name + " " + hr.last_name if hr is not None else "Unknown"
    host_email = hr.email
    # get row for user
    ur = db(db.auth_user.id == user).select().first()
    user_name = ur.first_name + " " + ur.last_name if ur is not None else "Unknown"
    
    conversation_id = db.conversation.insert(
        event_id=event_id,
        host_id=host.id,
        user_id=user,
        host_name=host_name,
        user_name=user_name,
        host_email=host_email,
    )
    conversation = db.conversation[conversation_id]
    return dict(conversation=conversation)


@action('message', method="POST")
@action.uses(db, session, auth.user, url_signer.verify())
def message():
    conversation_id = request.json.get('conversation_id')
    message_body = request.json.get('message_body')
    message_id = db.message.insert(
        conversation_id=conversation_id,
        message=message_body,
        creator_id=get_user(),
    )
    new_message = db.message[message_id]
    return dict(message=new_message)


@action('load_conversations', method="GET")
@action.uses(db, session, auth.user, url_signer.verify())
def load_conversations():
    conversations = db(
        ((db.conversation.host_id == get_user()) | (db.conversation.user_id == get_user()))
    ).select().as_list()
    #print("CONVOS: ", conversations)
    return dict(conversations=conversations)


@action('load_messages', method="POST")
@action.uses(db, session, auth.user, url_signer.verify())
def load_messages():
    conversation_id = response.json.get('conversation_id')
    assert conversation_id is not None
    messages = db(
        (db.message.conversation_id == conversation_id)
    ).select(orderby=db.messages.date).as_list()
    return dict(messages=messages)

def download1():
    return response.download(request, db)

def download2():
    pic = db(db.images).select().first().picture   #select first picture
    return dict(pic=pic)

# def display_form():
#     record = db.event(request.args(0))
#     form = SQLFORM(db.event, record, deletable=True,
#                     upload=URL('download'))
#     if form.process().accepted:
#         response.flash = 'form accepted'
#     elif form.errors:
#         response.flash = 'form has errors'
#     return dict(form=form)

# def download():
#     reponse.download(request, db)

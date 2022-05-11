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
from .models import get_user_email
from py4web.utils.form import Form, FormStyleBulma
from .common import Field

url_signer = URLSigner(session)

@action('index')
@action.uses('index.html', db, auth, url_signer)
def index():
    if auth.user_id:
        redirect(URL("feed"))
    return dict(
        # COMPLETE: return here any signed URLs you need.
        my_callback_url = URL('my_callback', signer=url_signer),
    )

@action('feed') # /fixtures_example/index
@action.uses('feed.html', url_signer, db, auth.user)
def index():
    rows = db(db.event).select(orderby=db.event.date|db.event.time)
    attending = db(
        (db.attendees.user_id == auth.user_id) &
        (db.event.id == db.attendees.event_id)
    ).select(db.event.id, db.event.host, db.event.event_name,
             db.event.location, db.event.price, db.event.date,
             db.event.time)
    sent_messages = db(
        (db.messages.user_from == get_user_email())
    ).select()
    received_messages = db(
        (db.messages.user_to == get_user_email())
    ).select()
    sent_dict = {} # dictionary w/ keys = recipients and values = list of messages 
    received_dict = {} # dictionary w/ keys = recipients and values = list of messages 
    # IDEA: Make dictionary with key = "user + recipient" and value = another dict with time as key and value = message
    #   with a 0 or 1 as the first character depending on whether it is from the sender or receiver
    mega_dict = {} # {'blah@ucsc.edunoah@ucsc.edu': {'12-3-4 2:00:32:32432423': MESSAGE, '12-4-4 2:00:32:32432423': AnotherMESSAGE}}
    for sent_message in sent_messages:
        recipient = sent_message['user_to']
        sender = sent_message['user_from']
        key = recipient + sender # mega_dict key = combo of sender and recipient
        #print("recipient:", sent_message['user_to'])
        #print("SENT MESSAGE:", sent_message)
        message_text = "1" + sent_message['message']
        time_stamp = sent_message['date']
        if key not in mega_dict:
            mega_dict[key] = {}
        mega_dict[key][time_stamp] = message_text
    for received_message in received_messages:
        # Sender and recipient are swapped!
        sender = received_message['user_to']
        recipient = received_message['user_from']
        key = recipient + sender # key = combo of sender and recipient
        #print("RECEIVED KEY:", key)
        message_text = "0" + received_message['message']
        time_stamp = received_message['date']
        if key not in mega_dict:
            mega_dict[key] = {}
        mega_dict[key][time_stamp] = message_text
    for key in mega_dict:
        mega_dict[key] = ct.OrderedDict(sorted(mega_dict[key].items()))
    #print(mega_dict)
    return dict(rows=rows, attending=attending, mega_dict=mega_dict, url_signer=url_signer)


@action('myevents')
@action.uses('myevents.html', url_signer, db, auth.user)
def myevents():
    rows = db(db.event.created_by == get_user_email()).select()
    attending = db(
         (db.attendees.user_id == auth.user_id) &
         (db.event.id == db.attendees.event_id)
     ).select(db.event.id, db.event.host, db.event.event_name, db.event.location, db.event.price)
    return dict(rows=rows, attending=attending, url_signer=url_signer)

@action('add', method=["GET", "POST"])
@action.uses('add.html', db, session, auth.user)
def add():
    # Insert form: no record= in it.
    form = Form(db.event, csrf_session=session, formstyle=FormStyleBulma)
    if form.accepted:
        # We simply redirect; the insertion already happened.
        redirect(URL('index'))
    # Either this is a GET request, or this is a POST but not accepted = with errors.
    return dict(form=form)

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

@action('delete/<event_id:int>')
@action.uses(db, session, auth.user, url_signer.verify())
def delete(event_id=None):
    assert event_id is not None
    db(db.event.id == event_id).delete()
    redirect(URL('myevents'))

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

@action('attend/<event_id:int>')
@action.uses(db, session, auth.user)
def attend(event_id=None):
    assert event_id is not None
    e = db.event[event_id]
    if e is None:
        redirect(URL('index'))
    a = db(
        (db.attendees.event_id == event_id) &
        (db.attendees.user_id == auth.user_id)
    )
    if a.select().first() is None:
        db.attendees.insert(event_id=event_id, user_id=auth.user_id)
    else:
        a.delete()
    redirect(URL('index'))

@action('message/<created_by>', method = ["GET", "POST"])
@action.uses('message.html', db, session, auth.user, url_signer)
def message(created_by=None):
    assert created_by is not None
    # use a when a guest is starting the conversation and the users are not in messages db yet
    a = db(
        (db.event.created_by == created_by)
    ).select().first()
    # use b when a convo already exists and both names are in the messages db
    b = db(
        ((db.messages.user_from + db.messages.user_to) == created_by)
    ).select().first()
    print("QUERY B:", b)
    form = Form([Field('note', 'text')],  csrf_session=session, formstyle=FormStyleBulma)
    if form.accepted:
        note = form.vars['note']
        cur_time = datetime.datetime.utcnow()
        #print("TIME:", cur_time)
        event = 0
        to = ''
        # affiliate message streams with events
        if b!= None:
            event = None # placeholder, eventually we will find a way to link events to conversations
            to = b['user_from'] 
            #print("TO:", to)
        elif a != None:
            event = a['id'] 
            to = a['created_by'] # send message to host
        db.messages.insert(
            user_from=get_user_email(),
            user_to=to,
            message=note,
            event_id=event,
            date=cur_time, # DATETIME STUFF GIVING ME ERRORS
            #time=cur_time.time(),
        )
        redirect(URL('feed'))
    return dict(form=form)

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

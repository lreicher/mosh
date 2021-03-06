"""
This file defines the database models
"""

import datetime
#from importlib.metadata import requires

#from pkg_resources import require
from .common import db, Field, auth, T
from pydal.validators import *


def get_user_email():
    return auth.current_user.get('email') if auth.current_user else None


def get_user_age():
    if not auth.current_user:
        return None
    birth = auth.current_user.get('birthday')
    now = datetime.date.today()
    age = (now - birth).days / 365
    return age

def get_user():
    return auth.current_user.get('id') if auth.current_user else None


def get_time():
    return datetime.datetime.utcnow()


db.define_table(
    'event',
    Field('host', requires=IS_NOT_EMPTY()),
    Field('event_name', requires=IS_NOT_EMPTY()),
    Field('location', requires=IS_NOT_EMPTY()),
    Field('description', 'text', requires=IS_NOT_EMPTY()),
    Field('price', 'float', default=0),
    Field('date', 'date', requires=IS_NOT_EMPTY()),
    Field('time', 'time', requires=IS_NOT_EMPTY()),
    Field('time_guidelines', requires=IS_NOT_EMPTY()),
    Field('alcohol', requires=IS_NOT_EMPTY()),
    Field('marijuana', requires=IS_NOT_EMPTY()),
    Field('image'),
    Field('created_by', requires=IS_NOT_EMPTY()),
    Field('creation_date', 'datetime', requires=IS_NOT_EMPTY()),
)

db.event.when = Field.Virtual(lambda row: row.event.date.strftime('%A %m/%d/%Y ') + row.event.time.strftime('@ %I:%M %p'))
db.event.when.readable = db.event.when.writable = False
db.event.id.readable = db.event.id.writable = False
db.event.created_by.readable = db.event.created_by.writable = False
db.event.creation_date.readable = db.event.creation_date.writable = False

db.define_table(
    'conversation',
    Field('event_id', 'references event', requires=IS_NOT_EMPTY()),
    Field('host_id', 'references auth_user', requires=IS_NOT_EMPTY()),
    Field('user_id', 'references auth_user', requires=IS_NOT_EMPTY()),
    Field('host_name', requires=IS_NOT_EMPTY()),
    Field('user_name', requires=IS_NOT_EMPTY()),
    Field('host_email', requires=IS_NOT_EMPTY()),
    Field('event_name', requires=IS_NOT_EMPTY()),
)

db.define_table(
    'message',
    Field('conversation_id', 'references conversation', requires=IS_NOT_EMPTY()),
    Field('creator_email', requires=IS_NOT_EMPTY()),
    Field('message', requires=IS_NOT_EMPTY()),
    Field('date', 'datetime', default=get_time),
    Field('is_read', 'boolean', default=False, requires=IS_NOT_EMPTY())
)

db.define_table(
    'attendees',
    Field('event_id', 'references event', requires=IS_NOT_EMPTY(), ondelete='CASCADE'),
    Field('user_id', 'references auth_user', requires=IS_NOT_EMPTY(), ondelete='CASCADE'),
    Field('attending', 'boolean', requires=IS_NOT_EMPTY(), default=False),
)

db.commit()

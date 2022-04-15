"""
This file defines the database models
"""

import datetime
from .common import db, Field, auth, T
from pydal.validators import *


def get_user_email():
    return auth.current_user.get('email') if auth.current_user else None

def get_time():
    return datetime.datetime.utcnow()


db.define_table(
    'event',
    Field('host', requires=IS_NOT_EMPTY()),
    Field('event_name', requires=IS_NOT_EMPTY()),
    Field('location', requires=IS_NOT_EMPTY()),
    Field('description', 'text', requires=IS_NOT_EMPTY()),
    Field('price', 'float', default=0),
    Field('created_by', default=get_user_email),
    Field('creation_date', 'datetime', default=get_time),
)

db.define_table(
    'attendees',
    Field('event_id', 'references event', requires=IS_NOT_EMPTY(), ondelete='CASCADE'),
    Field('user_id', 'references auth_user', requires=IS_NOT_EMPTY(), ondelete='CASCADE'),
)

db.event.id.readable = db.event.id.writable = False
db.event.created_by.readable = db.event.created_by.writable = False
db.event.creation_date.readable = db.event.creation_date.writable = False

db.commit()

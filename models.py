"""
This file defines the database models
"""

import datetime
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
    Field('image', 'upload', uploadfield='picture_file'),
    Field('picture_file', 'blob'),
    Field('created_by', default=get_user_email),
    Field('creation_date', 'datetime', default=get_time),
)

db.event.when = Field.Virtual(lambda row: row.event.date.strftime('%A %m/%d/%Y ') + row.event.time.strftime('@ %I:%M %p'))
db.event.when.readable = db.event.when.writable = False
db.event.id.readable = db.event.id.writable = False
db.event.created_by.readable = db.event.created_by.writable = False
db.event.creation_date.readable = db.event.creation_date.writable = False

db.define_table(
    'attendees',
    Field('event_id', 'references event', requires=IS_NOT_EMPTY(), ondelete='CASCADE'),
    Field('user_id', 'references auth_user', requires=IS_NOT_EMPTY(), ondelete='CASCADE'),
)

db.commit()

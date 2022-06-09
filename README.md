MOSH
by Noah Libeskind, Angelina Hool, Sarah Liang, Sude Yazgan, Hale Guyer, Batuhan Salih, and Lucas Reicher

Overview/Process
Mosh is a social-media style web application aimed at providing a more organized and safe way to host and find parties. To design our user interface, we made a wireframe design with a main feed of events as the center focus, with supporting features on the side such as messaging and the list of the user's saved parties. Once we created a basic layout, we began to implement these three main elements in HTML, creating the necessary database tables, and getting them linked across all parts of the py4web ecosystem in our controllers file. After an MVP was implemented with these core features, we began the refinement and migration to JS from static HTML. It was at this stage that we began the final stages of implementation which included making users' profiles more customizable, creating a calendar view for events, designing a more interactive and visually pleasing front-end, and adding in final features. 

Feature Set
The core feature is the feed of events. Displayed in the middle column of our home page, hosts are offered the functionality to create an event, where they will be able to enter in the key event fields like the name of the host, the event name, event location, description, price, date, time, time guidelines, substance guidelines, and cover photo. After entering the event information, the event will show up on the feed that hosts all users created events with their individual parameters, picture, and description about the event. Users of the app can click the host profile icon and read more information about the host or click the attend button if they wish to attend. The next key feature is in the leftmost column where users can see the list of the events they are attending, expand it for more details, and if it is the day of the event, have a cop alert button to warn party hosts that their party might meet a swift end. In line with communication to the host, we have our novel messaging feature. Messaging allows users of the app to send questions to the event host and offers an efficient way for the hosts to check in with their attendees. Some additional features include a calendar view of the events, and a “view my events” page where users can view events that they are hosting, view the attendees (people who have saved their event), and edit event details by clicking on the table entries and making changes directly to the table.

Technical Review
Initially, we created a Py4Web project implementing a table with the basic add/edit/delete functionality that we worked on in Homework 3 but with events instead of bird watching statistics. Users were able to create events with minimal attributes and save them to the database. When displaying the events, we used an orderBy option to order events by earliest date/time first. To improve the readability of event date/time, we created a VirtualField that would format the date and time into an easily readable phrase, specifying the day of the week in English. Soon after we implemented event attendees and the ability to attend and unattend specific events. The attending functionality was achieved through a one-to-many connection between events and an attending record that would record the user’s identity, event id, and a flag discerning whether or not the user was attending. When the attending button is clicked, the flag would either be toggled, or in the case that no matching attending row existed, it would create a row with the attending flag set to true. Additionally, events that the user had attended will show up under the “Saved Events” tab, so that the user could easily keep track of their attended events. If a user owns an event, they are also able to view the list of attending users. Soon after, we altered the auth_user model to include a phone number, birthdate, and required emails to be in either the ucsc.edu or cabrillo.edu domains. This was accomplished through the “extra_field” option in the Auth declaration within common.py. To achieve the whitelisted domain names, we altered auth_user.email.requires to perform a regex match on both domains. We also included a bio attribute in auth.py and form.py (the changes to these two files are not represented in our GitHub repository because they are outside the scope of this application, but rather in the scope of the Py4Web framework) this allowed users to create a short biography about themselves that can be displayed if they host an event and another user clicks on their profile icon.
Once we had this basic event/attending functionality done, we began integrating our progress into the provided Vue.js template. At this point we decided to organize the website into a single page, meaning there would be no redirects required when interacting with the page. Firstly, we switched from Py4Web forms to embedded forms within the main page. Doing so gave us much more flexibility in the event creation UI. We decided that the event feed would not refresh in real time, meaning that if a user posted a new event, other users would need to refresh the page in order to see them. This is similar to other social media apps. Additionally, in order to visualize the events a user themselves are hosting, it was required to also pass the user’s email in the initializer. Note that all database actions performed in controllers.py are safely behind checks that verify the user has the appropriate permissions to perform such actions. 
The messaging feature was arguably the most difficult to implement. We used two database tables for this, one to manage conversations between users and another to manage messages within conversations. Users can start conversations by clicking on the “start conversation” button on a given event. This creates a conversation entry in the database with the guest who started the conversation and the host of the event. Users can click on a conversation pertaining to a specific event in the messages column on the far right side of the page. In a conversation, hosts and guests can exchange messages with regard to the event. We set it up this way in our database because it was costly to pull all of a user’s messages every time they wanted to open one conversation. Maintaining the conversations data table allowed us to only pull messages between one user and another each time the user wants to read/send messages.
We had to order messages by their send date in index.html. We determined which side to display the sent messages versus received messages by comparing the current user’s email to the message creator’s email. We displayed a header that says “Message with [user]” which we did by checking if the user’s email was the host, in which case [user] is the guest, otherwise [user] is the host. This way the correct name was always displayed for who the message was being sent to. The messaging feature went through many iterations before it became what it is now. Before we transitioned to vue, it was done with a simple input text form that required a different html page. I (Noah) originally implemented messaging by creating one messaging data table and pulling all the server messages on the server each time a message was sent to load all messages. This setup required pulling every message on the server each time the messages were loaded. This worked on a very small scale, but inevitably it would need to be improved. 
In order to achieve “real-time” messaging between users, we found it necessary to poll for unread messages while a conversation was open. Initially, we sent a GET request that would simply retrieve the entire list of messages, however, we found this to be a large waste of network resources, and so decided to only poll for messages that had not yet been seen by the receiving user. This required an alteration of the message table to include a flag discerning whether or not the message was read by the other user. Every 5 seconds, the user’s Vue instance will send a GET request to the server. The server will query the messages table for any messages within the conversation of which the unread flag is true. Note that in order to be fetched, the message has to be both unread and not created by the user requesting the unread messages. Once fetched, the flag will be toggled and subsequent polls will ignore those messages. Unread messages will then be displayed on the user’s screen by appending them to the pre-existing list of messages. Additionally, on the initial loading of messages when a user opens a conversation, we found it necessary to update the unread status of any messages not yet read, so that there would not be duplicates when we poll later. 
We used calendars to better organize events by their date and improve the user’s experience. We created multiple calendar views so that users can pick which events to display on their calendar. The four main calendars are “hosting”, “attending”, “feed” and “all events”. The main calendar is called vcall, this calendar contains feed, hosting and attending. All calendars are independent of each other and one event can show up in only one calendar (hosting, attending, feed).  
Originally, we wanted users to be able to upload cover images for their events from their computer. We referenced some examples from lecture to do this, specifically the image preview and contact app with images examples. There were many complications, but in the end we were able to get it to upload an image, preview the image on the form, and post the image on the feed. However, the image that was uploaded would be displayed on all of the posts on the feed, which is not what we wanted. One problem we encountered was that the image was not added to the database when the user clicked the “Post” button, so this meant that when trying to display the image on the feed, it wasn't able to pull from the database because it did not exist yet. In the end, we modified the functionality of the site so that when the user creates a new event, they can choose from a few options of background images which would be displayed on their event. We chose to take this route of choosing from pre-selected images instead of allowing users to upload images because the implementation was more straightforward and it also would help reduce server memory usage.

Upon trying to get the finalized version of our application hosted through Google Cloud, we were met with several technical issues. After configuring our Google Cloud Project and MySQL framework in the Google Cloud, we linked our online project to Py4Web to host our website. There is a necessary private folder omitted in the repository for privacy that holds the information needed to access the database. Additionally, we made changes to common.py and settings.py to set the needed migration variables to the proper values. We then created symbolic links across the higher level apps folder of Py4Web to create an apps folder specifically for the Google App Engine (gae). It is here we linked a .service file that facilitates service while online, _default folder that gae defaults to if it can’t find our third symbolic link that is our app name itself (mosh). Upon deploying the app we were met with numerous technical issues, however after entering several commands into our SQL database in the Cloud Shell, we were able to successfully migrate all of our tables in models.py and get all core functionality working. Currently, our url https://slugmosh.com hosts our website.



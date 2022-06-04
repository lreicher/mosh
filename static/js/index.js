// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};


// Given an empty app object, initializes it filling its attributes,
// creates a Vue instance, and then initializes the Vue instance.
let init = (app) => {
    // Calendar hierarchy Hosting > Attending > Feed
    // This is the Vue data.
    app.data = {
        user_email: "",
        user_name: "",
        events: [],
        conversations: [],
        attending: [],
        messages: [],
        add_status: false,
        view_myevents: false,
        new_event_host: "",
        new_event_name: "",
        new_event_location: "",
        new_event_description: "",
        new_event_price: 0,
        new_event_date: "",
        new_event_time: "",
        new_event_time_guidelines: "",
        new_event_alcohol: "",
        new_event_marijuana: "",
        open_conversation: -1,
        expanded_event: -1,
        open_profile: 0,
        host_name: "", 
        add_message: "",
        vcattending: [ 
            {
                key: -1,
                highlight: true,
                dates: new Date(),
            },
        ],
        vchosting: [ 
            {
                key: -1,
                highlight: true,
                dates: new Date(),
            },
        ],
        vcall: [ 
            {
                key: -1,
                highlight: true,
                dates: new Date(),
            },
        ],
        vcfeed: [ 
            {
                key: -1,
                highlight: true,
                dates: new Date(),
            },
        ],
        vcolor: {'attending': 'green', 'hosting': 'red', 'feed': 'yellow'},
        // Calendar List
        // Complete as you see fit.
    };

    app.enumerate = (a) => {
        // This adds an _idx field to each element of the array.
        let k = 0;
        a.map((e) => {e._idx = k++;});
        return a;
    };

    app.decorate = (a) => {
        a.map((e) => {
            e._state = {host: "clean", event_name: "clean",
                location: "clean", description: "clean",
                price: "clean", date: "clean",
                time: "clean", time_guidelines: "clean",
                alcohol: "clean", marijuana: "clean"};
            e._server_vals = {host: e.host, event_name: e.event_name,
                location: e.location, description: e.description,
                price: e.price, date: e.date,
                time: e.time, time_guidelines: e.time_guidelines,
                alcohol: e.alcohol, marijuana: e.marijuana};
        });
        return a;
    };

    app.complete = (events) => {
        events.map((event) => {
            event.attending = false;
        });
    };

    app.add_event = function () {
        axios.post(add_event_url,
            {
                event_host: app.vue.new_event_host,
                event_name: app.vue.new_event_name,
                event_location: app.vue.new_event_location,
                event_description: app.vue.new_event_description,
                event_price: app.vue.new_event_price,
                event_date: app.vue.new_event_date,
                event_time: app.vue.new_event_time,
                event_time_guidelines: app.vue.new_event_time_guidelines,
                event_alcohol: app.vue.new_event_alcohol,
                event_marijuana: app.vue.new_event_marijuana,
                _state: {host: "clean", event_name: "clean",
                        location: "clean", description: "clean",
                        price: "clean", date: "clean",
                        time: "clean", time_guidelines: "clean",
                        alcohol: "clean", marijuana: "clean"},
            }).then(function (response) {
                console.log(response)
                app.vue.events.push({
                    id: response.data.event.id,
                    host: app.vue.new_event_host,
                    event_name: app.vue.new_event_name,
                    location: app.vue.new_event_location,
                    description: app.vue.new_event_description,
                    price: app.vue.new_event_price,
                    date: app.vue.new_event_date,
                    time: app.vue.new_event_time,
                    when: response.data.event.when,
                    time_guidelines: app.vue.new_event_time_guidelines,
                    alcohol: app.vue.new_event_alcohol,
                    marijuana: app.vue.new_event_marijuana,
                    created_by: response.data.event.created_by,
                    creation_date: response.data.event.creation_date,

                    image: "",

                    attending: false,
                    _state: {
                        host: "clean", event_name: "clean",
                        location: "clean", description: "clean", 
                        price: "clean", date: "clean",
                        time: "clean", time_guidelines: "clean", alcohol: "clean",
                        marijuana: "clean"
                    },
                    _server_vals: {
                        host: app.vue.new_event_host,
                        event_name: app.vue.new_event_name,
                        location: app.vue.new_event_location,
                        description: app.vue.new_event_description,
                        price: app.vue.new_event_price,
                        date: app.vue.new_event_date,
                        time: app.vue.new_event_time,
                        time_guidelines: app.vue.new_event_time_guidelines,
                        alcohol: app.vue.new_event_alcohol,
                        marijuana: app.vue.new_event_marijuana,
                    },
                });
                let vcevent = response.data.event;
                console.log(vcevent);
                // Hosting Calendar
                app.calendar_add_event(vcevent,app.vue.vchosting,String(app.data.vcolor['hosting']));
                app.calendar_add_event(vcevent,app.vue.vcall,String(app.data.vcolor['hosting']));
                app.enumerate(app.vue.events);
                app.reset_event_form();
                app.set_add_status(false);
            });
    };

    app.delete_event = function(event_idx) {
        let id = app.vue.events[event_idx].id;
        axios.post(delete_event_url, {id: id}).then(function (response) {
            for (let i = 0; i < app.vue.events.length; i++) {
                if (app.vue.events[i].id === id) {
                    app.calendar_delet_event(id,app.vue.vchosting);
                    app.calendar_delet_event(id,app.vue.vcattending);
                    app.calendar_delet_event(id,app.vue.vcfeed);
                    app.calendar_delet_event(id,app.vue.vcall);
                    app.vue.events.splice(i, 1);
                    app.enumerate(app.vue.events);
                    break;
                }
            }
        });
    };

    app.reset_event_form = function () {
        app.vue.new_event_host = "";
        app.vue.new_event_name = "";
        app.vue.new_event_location = "";
        app.vue.new_event_description = "";
        app.vue.new_event_price = 0;
        app.vue.new_event_date = "";
        app.vue.new_event_time = "";
        app.vue.new_event_time_guidelines = "";
        app.vue.new_event_alcohol = "";
        app.vue.new_event_marijuana = "";
    };

    app.set_add_status = function (new_status) {
        app.vue.add_status = new_status;
    };

    app.start_edit = function (event_idx, fn) {
        app.vue.events[event_idx]._state[fn] = "edit";
    };

    app.stop_edit = function (event_idx, fn) {
        let event = app.vue.events[event_idx];
        let event_exist_vcall = -1;
        let event_exist_vcattending = -1;
        let event_exist_vcfeed = -1;
        let event_exist_vchosting = -1;

        if (event._state[fn] === 'edit') {
            if (event._server_vals[fn] !== event[fn]) {
                event._state[fn] = "pending";
                axios.post(edit_event_url, {
                    id: event.id, field: fn, value: event[fn]
                }).then(function (result) {
                    event_exist_vcall = app.vue.vcall.findIndex(x=>x.key === event.id);
                    event_exist_vcattending = app.vue.vcattending.findIndex(x=>x.key === event.id);
                    event_exist_vcfeed= app.vue.vcfeed.findIndex(x=>x.key === event.id);
                    event_exist_vchosting = app.vue.vchosting.findIndex(x=>x.key ===event.id);

                    if(event_exist_vcfeed != -1){
                        app.calendar_delet_event(event.id,app.vue.vcfeed)
                        app.calendar_delet_event(event.id,app.vue.vcall)

                        app.calendar_add_event(event,app.vue.vcfeed,String(app.data.vcolor['feed']));
                        app.calendar_add_event(event,app.vue.vcall,String(app.data.vcolor['feed']));
                    }

                    if(event_exist_vcattending != -1){
                        app.calendar_delet_event(event.id,app.vue.vcattending);
                        app.calendar_delet_event(event.id,app.vue.vcall)

                        app.calendar_add_event(event,app.vue.vcattending,String(app.data.vcolor['attending']));
                        app.calendar_add_event(event,app.vue.vcall,String(app.data.vcolor['attending']));
                    }

                    if(event_exist_vchosting != -1){
                        // Hosting Calendar
                        app.calendar_delet_event(event.id,app.vue.vchosting);
                        app.calendar_delet_event(event.id,app.vue.vcall)

                        app.calendar_add_event(event,app.vue.vchosting,String(app.data.vcolor['hosting']));
                        app.calendar_add_event(event,app.vue.vcall,String(app.data.vcolor['hosting']));
                    }

                    event._state[fn] = "clean";
                    event._server_vals[fn] = event[fn];
                })
            } else {
                event._state[fn] = "clean";
            }
        }
    };

    app.set_view_myevents_status = function (new_status) {
        app.vue.view_myevents = new_status;
    };

    app.toggle_attending = function (event_idx) {
        let event_exist_vchosting = -1;
        let event = app.vue.events[event_idx];
        event.attending = !event.attending;
        axios.post(set_attending_url, {event_id: event.id, status: event.attending});
        if (event.created_by != app.vue.user_email) {
            if(event.attending){
                //console.log(String(app.data.vcolor['attending']));
                app.calendar_delet_event(event.id,app.vue.vcfeed);
                app.calendar_delet_event(event.id,app.vue.vcall);
                app.calendar_add_event(event,app.vue.vcattending,String(app.data.vcolor['attending']));
                app.calendar_add_event(event,app.vue.vcall,String(app.data.vcolor['attending']));
            }
            else{
                app.calendar_delet_event(event.id,app.vue.vcattending);
                app.calendar_delet_event(event.id,app.vue.vcall);
                app.calendar_add_event(event,app.vue.vcfeed,String(app.data.vcolor['feed']));
                app.calendar_add_event(event,app.vue.vcall,String(app.data.vcolor['feed']));
            }
        }
    };

    app.start_conversation = function (event_idx) {
        let event = app.vue.events[event_idx];
        const exists = (element) => element.event_id === event.id;
        if (!(app.vue.conversations.some(exists))) {
            axios.post(start_conversation_url, {event_id: event.id}).then(function (response) {
                app.vue.conversations.push(response.data.conversation);
                app.enumerate(app.vue.conversations);
            });
        }
    };

    // loads and refreshes a single conversation into a modal
    app.load_conversation = function (convo_idx) {
        let convo = app.vue.conversations[convo_idx];
        app.vue.open_conversation = convo;
        axios.get(load_messages_url, {params: {conversation_id: app.vue.open_conversation.id}}).then(function (response) {
            app.vue.messages = response.data.messages;
        });
        const id = setInterval(load_messages, 5000);
        function load_messages() {
            //console.log("Loading messages");
            if (app.vue.open_conversation === -1) {
                //console.log("Stopping load messages");
                clearInterval(id);
            }
            else {
                //console.log("Sending HTTP GET to retrieve messages");
                axios.get(load_unread_messages_url, {params: {conversation_id: app.vue.open_conversation.id}}).then(function (response) {
                    let unread = response.data.unread_messages;
                    app.vue.messages.push.apply(app.vue.messages, unread);
                });
            }
        }
    };

    app.close_conversation = function () {
        app.vue.messages = [];
        app.vue.open_conversation = -1;
        app.vue.add_message = "";
    };

    app.send_message = function (convo_idx) {
        let convo = app.vue.conversations[convo_idx];
        axios.post(send_message_url, {conversation_id: convo.id, message_body: app.vue.add_message}).then(function (response) {
            app.vue.messages.push(response.data.message);
            app.enumerate(app.vue.messages);
        });
        app.vue.add_message = "";
    };

    app.upload_file = function (event, event_idx) {
        let input = event.target;
        let file = input.files[0];
        let e = app.vue.events[event_idx];

        if (file) {
            let reader = new FileReader();
            reader.addEventListener("load", function () {
                // Sends the image to the server.
                axios.post(upload_image_url,
                    {
                        event_id: e.id,
                        image: reader.result,
                    })
                    .then(function () {
                        // Sets the local preview.
                        e.image = reader.result;

                    });
            });
            reader.readAsDataURL(file);
        }
    };

    app.expand_event = function (event_idx) {
        let event = app.vue.events[event_idx];
        app.vue.expanded_event=event;
    };

    app.host_profile = function (host_email) {
        app.vue.open_profile = 1
        axios.get(open_profile_url, {params: {host_email: host_email}}).then(function (response) {
            app.vue.host_name = response.data.name;
        });
    }

    // Calendar Functions
    app.calendar_add_event = function(event,vcalendar,color) {
        // parse the date
        let list_date = String(event.date).split("-");
        let year = Number(list_date[0]);
        let month = Number(list_date[1]) - 1;
        let day = Number(list_date[2]);
        let time_lable = String('N/A');
        console.log(event.time);
        // parse the time
        if ((event.time) === null){
            console.log("CHECK 1\n");
            time_lable = String('N/A');
        }
        else{
            console.log("CHECK 2\n");
            let list_time = String(event.time).split(":");
            console.log(String(event.time));
            let hour = Number(list_time[0]);
            let ampm = 'AM';
            if (hour > 12 ){
                hour = hour - 12;
                ampm = 'PM';
            }
            time_lable = String(hour)+":"+String(Number(list_time[1]))+String(ampm);
        }


        // add to calendar
        vcalendar.push(
            {
                key: event.id,
                bar: color,   
                dates: new Date(year, month , day),
                popover: {
                    label: "Event name: "+String(event.event_name)+'\n'+
                            "Time: "+time_lable,
                    isInteractive: true,
                    transition: 'fade',
                    visibility: 'hover',
                },
            }
        );

    };

    app.calendar_delet_event = function(id,vcalendar) {
        let index_delet_event = vcalendar.findIndex(x=>x.key === id);
        // if element exists
        if(index_delet_event != -1){
            vcalendar.splice(index_delet_event,1);
        }
    };

    // This contains all the methods.
    app.methods = {
        delete_event: app.delete_event,
        add_event: app.add_event,
        reset_event_form: app.reset_event_form,
        set_add_status: app.set_add_status,
        set_view_myevents_status: app.set_view_myevents_status,
        toggle_attending: app.toggle_attending,
        start_conversation: app.start_conversation,
        load_conversation: app.load_conversation,
        close_conversation: app.close_conversation,
        send_message: app.send_message,
        start_edit: app.start_edit,
        stop_edit: app.stop_edit,
        upload_file: app.upload_file,
        calendar_add_event: app.calendar_add_event,
        calendar_delet_event: app.calendar_delet_event,
        expand_event: app.expand_event,
        host_profile: app.host_profile,
    };

    // This creates the Vue instance.
    app.vue = new Vue({
        el: "#vue-target",
        data: app.data,
        methods: app.methods
    });

    // And this initializes it.
    app.init = () => {
        axios.get(load_feed_url).then(function (response) {
            let events = response.data.events;
            app.enumerate(events);
            // app.vue.events = app.decorate(app.enumerate(events));
            app.decorate(events);
            app.complete(events);
            app.vue.events = events;
            app.vue.user_email = response.data.user_email;
            app.vue.attending = response.data.attending;

            app.upload_file = response.data.upload_file;

        }).then(() => {
            for (let event of app.vue.events) {
                let event_exist_vchosting = -1;
                for (let attend of app.vue.attending) {
                    if (event.id === attend.event_id && attend.attending === true) {
                        event.attending = true;
                        if (event.created_by != app.vue.user_email) {
                            app.vue.calendar_add_event(event,app.vue.vcattending,String(app.data.vcolor['attending']));
                            app.calendar_add_event(event,app.vue.vcall,String(app.data.vcolor['attending']));
                        }
                        break;
                    }
                }
                // Hosting Calendar
                if (event.created_by === app.vue.user_email) {
                    app.vue.calendar_add_event(event,app.vue.vchosting,String(app.data.vcolor['hosting']));
                    app.calendar_add_event(event,app.vue.vcall,String(app.data.vcolor['hosting']));
                }
                else{
                    if(!(event['attending'])){
                        app.vue.calendar_add_event(event,app.vue.vcfeed,String(app.data.vcolor['feed']));
                        app.calendar_add_event(event,app.vue.vcall,String(app.data.vcolor['feed']));
                    }
                }
            }
        });

        axios.get(load_conversations_url).then( function (response) {
            let conversations = response.data.conversations;
            app.enumerate(conversations);
            app.vue.conversations = conversations;
        })
    };

    // Call to the initializer.
    app.init();
};

// This takes the (empty) app object, and initializes it,
// putting all the code i
init(app);

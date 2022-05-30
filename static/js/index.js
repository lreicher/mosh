// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};


// Given an empty app object, initializes it filling its attributes,
// creates a Vue instance, and then initializes the Vue instance.
let init = (app) => {

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
        open_conversation: -1,
        add_message: "",
        selection_done: false,
        uploading: false,
        uploaded_file: "",
        uploaded: false,
        img_url: "",
        attributes: [ 
            {
                key: 'today',
                highlight: true,
                dates: new Date(),
            },
        ]
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
                time: "clean"};
            e._server_vals = {host: e.host, event_name: e.event_name,
                location: e.location, description: e.description,
                price: e.price, date: e.date,
                time: e.time};
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
                _state: {host: "clean", event_name: "clean",
                        location: "clean", description: "clean",
                        price: "clean", date: "clean",
                        time: "clean"},
            }).then(function (response) {
                app.vue.events.push({
                    host: app.vue.new_event_host,
                    event_name: app.vue.new_event_name,
                    location: app.vue.new_event_location,
                    description: app.vue.new_event_description,
                    price: app.vue.new_event_price,
                    date: app.vue.new_event_date,
                    time: app.vue.new_event_time,
                    when: response.data.event.when,
                    created_by: response.data.event.created_by,
                    creation_date: response.data.event.creation_date,
                    attending: false,
                    _state: {
                        host: "clean", event_name: "clean",
                        location: "clean", description: "clean", 
                        price: "clean", date: "clean",
                        time: "clean"
                    },
                    _server_vals: {
                        host: app.vue.new_event_host,
                        event_name: app.vue.new_event_name,
                        location: app.vue.new_event_location,
                        description: app.vue.new_event_description,
                        price: app.vue.new_event_price,
                        date: app.vue.new_event_date,
                        time: app.vue.new_event_time,
                    }
                });
                app.enumerate(app.vue.events);
                app.reset_event_form();
                app.set_add_status(false);
            });
    };

    app.delete_event = function(event_idx) {
        let id = app.vue.events[event_idx].id
        axios.get(delete_event_url, {params: {id: id}}).then(function (response) {
            for (let i = 0; i < app.vue.events.length; i++) {
                if (app.vue.events[i].id === id) {
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
    };

    app.set_add_status = function (new_status) {
        app.vue.add_status = new_status;
    };

    app.start_edit = function (event_idx, fn) {
        app.vue.events[event_idx]._state[fn] = "edit";
    };

    app.stop_edit = function (event_idx, fn) {
        let event = app.vue.events[event_idx];
        if (event._state[fn] === 'edit') {
            if (event._server_vals[fn] !== event[fn]) {
                event._state[fn] = "pending";
                axios.post(edit_event_url, {
                    id: event.id, field: fn, value: event[fn]
                }).then(function (result) {
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
        let event = app.vue.events[event_idx];
        event.attending = !event.attending;
        axios.post(set_attending_url, {event_id: event.id, status: event.attending});
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

    // loads a single conversation into a modal
    app.load_conversation = function (convo_idx) {
        let convo = app.vue.conversations[convo_idx];
        app.vue.open_conversation = convo;
        axios.get(load_messages_url, {params: {conversation_id: app.vue.open_conversation.id}}).then(function (response) {
            app.vue.messages = response.data.messages;
        });
        const id = setInterval(load_messages, 5000);
        function load_messages() {
            console.log("Loading messages");
            if (app.vue.open_conversation === -1) {
                console.log("Stopping load messages");
                clearInterval(id);
            }
            else {
                console.log("Sending HTTP GET to retrieve messages");
                axios.get(load_messages_url, {params: {conversation_id: app.vue.open_conversation.id}}).then(function (response) {
                    app.vue.messages = response.data.messages;
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

    app.select_file = function (event) {
        // Reads the file.
        let input = event.target;
        app.file = input.files[0];
        if (app.file) {
            app.vue.selection_done = true;
            // We read the file.
            let reader = new FileReader();
            reader.addEventListener("load", function () {
                app.vue.img_url = reader.result;
            });
            reader.readAsDataURL(app.file);
        }
    };

    app.upload_complete = function (file_name, file_type) {
        app.vue.uploading = false;
        app.vue.uploaded = true;
    };

    app.upload_file = function () {
        if (app.file) {
            let file_type = app.file.type;
            let file_name = app.file.name;
            let full_url = file_upload_url + "&file_name=" + encodeURIComponent(file_name)
                + "&file_type=" + encodeURIComponent(file_type);
            // Uploads the file, using the low-level streaming interface. This avoid any
            // encoding.
            app.vue.uploading = true;
            let req = new XMLHttpRequest();
            req.addEventListener("load", function () {
                app.upload_complete(file_name, file_type)
            });
            req.open("PUT", full_url, true);
            req.send(app.file);
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
        select_file: app.select_file,
        upload_file: app.upload_file,
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



            app.img_url = response.data.img_url;
            app.upload_file = response.data.upload_file;

            

            let conversations = response.data.conversations;
            app.enumerate(conversations);
            app.vue.conversations = conversations;

        }).then(() => {
            for (let event of app.vue.events) {
                for (let attend of app.vue.attending) {
                    if (event.id === attend.event_id && attend.attending === true) {
                        event.attending = true;
                        break;
                    }
                }
            }
        });
    };

    // Call to the initializer.
    app.init();
};

// This takes the (empty) app object, and initializes it,
// putting all the code i
init(app);
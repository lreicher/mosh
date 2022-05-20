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
        // Complete as you see fit.
    };

    app.enumerate = (a) => {
        // This adds an _idx field to each element of the array.
        let k = 0;
        a.map((e) => {e._idx = k++;});
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
            }).then(function (response) {
                app.vue.events.unshift({
                    id: response.data.event.id,
                    host: response.data.event.host,
                    event_name: response.data.event.event_name,
                    location: response.data.event.location,
                    description: response.data.event.description,
                    price: response.data.event.price,
                    date: response.data.event.date,
                    time: response.data.event.time,
                    when: response.data.event.when,
                    created_by: response.data.event.created_by,
                    attending: false,
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

    app.set_view_myevents_status = function (new_status) {
        app.vue.view_myevents = new_status;
    };

    app.toggle_attending = function (event_idx) {
        let event = app.vue.events[event_idx];
        event.attending = !event.attending;
        axios.post(set_attending_url, {event_id: event.id, status: event.attending});
    };


    // This contains all the methods.
    app.methods = {
        delete_event: app.delete_event,
        add_event: app.add_event,
        reset_event_form: app.reset_event_form,
        set_add_status: app.set_add_status,
        set_view_myevents_status: app.set_view_myevents_status,
        toggle_attending: app.toggle_attending,

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
            app.complete(events);
            app.vue.events = events;
            app.vue.user_email = response.data.user_email;
            app.vue.attending = response.data.attending;
        }).then(() => {
            for (let event of app.vue.events) {
                for (let attend of app.vue.attending) {
                    if (event.id == attend.event_id) {
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

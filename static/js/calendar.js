
// max 4 events per day 
function calendar_add_event(num){
    return null
}
function calendar_delet_event(){
    return null
}

function calendar_event_update(){
    return [
        {
            key: 'today',
            highlight: true,
            dates: new Date(),
        },
        {
            dot: true,   
            highlight: {
                color: 'red',
                fillMode: 'light',
            },
            dates: new Date(2022, 4, 1)
        },
        {
            dot: true,   
            highlight: {
                color: 'red',
                fillMode: 'light',
            },
            dates: new Date(2022, 4, 1)
        },
        {
            dot: true,   
            highlight: {
                color: 'red',
                fillMode: 'light',
            },
            dates: new Date(2022, 4, 1)
        },
        {
            dot: true,   
            highlight: {
                color: 'red',
                fillMode: 'light',
            },
            dates: new Date(2022, 4, 1)
        },
        {
            dot: true,   
            highlight: {
                color: 'red',
                fillMode: 'light',
            },
            dates: new Date(2022, 4, 2)
        },
        {
            dot: true,   
            highlight: {
                color: 'red',
                fillMode: 'light',
            },
            dates: new Date(2022, 4, 2)
        },
        {
            dot: true,   
            highlight: {
                color: 'red',
                fillMode: 'light',
            },
            dates: new Date(2022, 4, 2)
        },
        {
            dot: true,   
            highlight: {
                color: 'red',
                fillMode: 'light',
            },
            dates: new Date(2022, 4, 2)
        },
        {

            highlight: {
                color: 'purple',
                fillMode: 'solid',
                contentClass: 'italic',
            },
            dates: new Date(2022, 4, 12),
        },
        {
            highlight: {
                color: 'purple',
                fillMode: 'light',
            },
            dates: new Date(2022, 4, 13),
        },
        {
            highlight: {
                color: 'purple',
                fillMode: 'outline',
            },
            dates: new Date(2022, 4, 14),
        },
    ]
}
new Vue({
    el: '#calendar_vue',
    data: {
        attributes: calendar_event_update(),
    },
    
})


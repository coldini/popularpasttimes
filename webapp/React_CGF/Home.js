"use strict";

const { useEffect } = React;

function Home(){
    return React.createElement('div', {className: 'home'},
        React.createElement('div', {id: 'content'},
            React.createElement('h1', null, 'Hello, and Welcome'),
            React.createElement('p', null, 'Are you wandering around a country wondering what exactly are you going to do with your time? Look no further! With our help we plan to help you figure out what to do with all that free time!')
        )
    );
}
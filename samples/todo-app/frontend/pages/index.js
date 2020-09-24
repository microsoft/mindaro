import React, { Component } from 'react'
import TodoApp from '../components/TodoApp'
import '../public/static/index.css'

export default class Index extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <TodoApp />
        );
    }
}

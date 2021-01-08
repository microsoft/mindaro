import React, { Component } from 'react';
import TodoItem from './TodoItem';
import TodoFooter from './TodoFooter';

class TodoApp extends Component {
    constructor(props) {
        super(props);

        this.state = {
            todos: [],
            settings: {
                ENTER_KEY: 13
            },
            newTodo: ''
        }

        this.handleNewTodoKeyDown = this.handleNewTodoKeyDown.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.toggleTodo = this.toggleTodo.bind(this);
        this.deleteTodo = this.deleteTodo.bind(this);
    }

    async callApi(method, routeUrl, body) {
        const res = await fetch(routeUrl, {
            method: method,
            cache: 'no-cache',
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            throw new Error(`Failed to call API '${routeUrl}'. Make sure that 'database-api' and 'todos-db' are running properly. Details: ${res.statusText}`);
        }

        const contentType = res.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return await res.json();
        }
        return res.text();
    }

    async getTodos() {
        const data = await this.callApi("GET", "/api/todos");
        if (data) {
            this.setState({ todos: data });
        }
    }

    async componentDidMount() {
        await this.getTodos();
    }

    async addTodo(newTodoTitle) {
        const newTodo = await this.callApi("POST", "/api/todos", { title: newTodoTitle, completed: false });
        this.setState({ todos: this.state.todos.concat(newTodo) });
    }

    async deleteTodo(todoToDelete) {
        const data = await this.callApi("DELETE", "/api/todos/" + todoToDelete.id, todoToDelete);
        if (data) {
            this.setState({ todos: data });
        }
    };

    async toggleTodo(todoToToggle) {
        const updatedTodo = {
            title: todoToToggle.title,
            completed: !todoToToggle.completed
        }
        const data = await this.callApi("PUT", "/api/todos/" + todoToToggle.id, updatedTodo);
        if (data) {
            this.setState({ todos: data });
        }
    }

    handleChange(event) {
        this.setState({ newTodo: event.target.value });
    }

    handleNewTodoKeyDown(event) {
        if (event.keyCode !== this.state.settings.ENTER_KEY) {
            return;
        }
        event.preventDefault();

        var val = this.state.newTodo.trim();

        if (val) {
            this.addTodo(val);
            this.setState({ newTodo: '' });
        }
    }

    render() {
        var todos = this.state.todos;
        var todoItems = todos.map((todo) => {
            return (
                <TodoItem
                    key={todo.id}
                    id={todo.id}
                    todo={todo}
                    onToggle={() => this.toggleTodo(todo)}
                    onDestroy={() => this.deleteTodo(todo)}
                />
            );
        });

        var activeTodoCount = todos.reduce(function (accum, todo) {
            return todo.completed ? accum : accum + 1;
        }, 0);

        var footer = (
            <TodoFooter todoCount={activeTodoCount} />
        );

        var credits = (
            <div className="credits">
                Adapted from <strong><a href="http://todomvc.com/">TodoMVC</a></strong>
                <style jsx>{`
                    .credits {
                        margin-top: 100px;
                        color: #bbb;
                        font: inherit;
                        font-style: inherit;
                        font-weight: 400;
                        font-size: 12px;
                        text-align: center;
                    } 
                    .credits a {
                        text-decoration: none;
                        color: inherit;
                    }
                `}</style>
            </div>
        );

        return (
            <div className="TodoApp">
                <h1 className="app-title">todos</h1>
                <div className="main">
                    <div className="edit-section">
                        <input className="new-todo"
                            placeholder="What needs to be done?"
                            value={this.state.newTodo}
                            onKeyDown={this.handleNewTodoKeyDown}
                            onChange={this.handleChange}
                            autoFocus={true}
                        />
                    </div>
                    <ul className="todo-list">
                        {todoItems}
                    </ul>
                    {footer}
                </div>
                {credits}
                <style jsx>{`
                    .TodoApp {
                        text-align: center;
                    }
                    .todo-list {
                        margin: 0;
                        padding: 0;
                        list-style: none;
                        text-align: left;
                    }
                    .main {
                        background-color: white;
                        margin: 50px 0 40px 0;
                        position: relative;
                        box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.2),
                                    0 25px 50px 0 rgba(0, 0, 0, 0.1);
                    }
                    .app-title {
                        width: 100%;
                        font-size: 96px;
                        font-weight: 100;
                        text-align: center;
                        color: rgba(175, 47, 47, 0.5);
                        -webkit-text-rendering: optimizeLegibility;
                        -moz-text-rendering: optimizeLegibility;
                        text-rendering: optimizeLegibility;
                    }
                    :focus {
                        outline: 0;
                    }
                    .new-todo, .edit {
                        margin: 0;
                        width: 100%;
                        font-size: 24px;
                        background: inherit;
                        font-family: inherit;
                        font-weight: inherit;
                        line-height: 1.4em;
                        border: 0;
                        color: inherit;
                        padding: 6px;
                    }
                    .new-todo::placeholder{
                        color: #bbb;
                        font-style: italic;
                    }
                    .edit-section {
                        padding: 10px;
                        border-bottom: 2px solid #ddd;
                    }
                `}</style>
            </div>
        );
    }
}

export default TodoApp;

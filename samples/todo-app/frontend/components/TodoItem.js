import React from 'react';
import classNames from 'classnames';

export default class TodoItem extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <li className={classNames({ completed: this.props.todo.completed })}>
                <div className="view">
                    <input
                        className="toggle"
                        type="checkbox"
                        checked={this.props.todo.completed}
                        onChange={this.props.onToggle}
                    />
                    <label>{this.props.todo.title}</label>
                    <button className="destroy" onClick={this.props.onDestroy} />
                </div>
                <style jsx>{`
                    li {
                        position: relative;
                        font-size: 24px;
                        border-bottom: 1px solid #ededed;
                    }
                    li:last-child {
                        border-bottom: none;
                    }
                    .toggle {
                        text-align: center;
                        width: 40px;
                        height: 40px;
                        position: absolute;
                        top: 0;
                        bottom: 0;
                        margin: auto 0;
                        border: none; /* Mobile Safari */
                        -webkit-appearance: none;
                        appearance: none;
                        opacity: 0;
                    }
                    .toggle + label {
                        background-image: url('data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%22-10%20-18%20100%20135%22%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2250%22%20fill%3D%22none%22%20stroke%3D%22%23ededed%22%20stroke-width%3D%223%22/%3E%3C/svg%3E');
                        background-repeat: no-repeat;
                        background-position: center left;
                    }
                    .toggle:checked + label {
                        background-image: url('data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%22-10%20-18%20100%20135%22%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2250%22%20fill%3D%22none%22%20stroke%3D%22%23bddad5%22%20stroke-width%3D%223%22/%3E%3Cpath%20fill%3D%22%235dc2af%22%20d%3D%22M72%2025L42%2071%2027%2056l-4%204%2020%2020%2034-52z%22/%3E%3C/svg%3E');
                    }
                    label {
                        word-break: break-all;
                        padding: 15px 15px 15px 60px;
                        display: block;
                        line-height: 1.2;
                        transition: color 0.4s;
                    }
                    .completed label {
                        color: #d9d9d9;
                        text-decoration: line-through;
                    }
                    .destroy {
                        display: none;
                        position: absolute;
                        top: 0;
                        right: 10px;
                        bottom: 0;
                        width: 40px;
                        height: 40px;
                        margin: auto 0;
                        font-size: 30px;
                        color: #cc9a9a;
                        margin-bottom: 11px;
                        transition: color 0.2s ease-out;
                    }
                    .destroy:hover {
                        color: #af5b5e;
                    }
                    .destroy:after {
                        content: '×';
                    }
                    li:hover .destroy {
                        display: block;
                        color: blue;
                    }
                `}</style>
            </li>
        );
    }
}

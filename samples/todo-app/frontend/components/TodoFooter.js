import React from 'react';
import Link from 'next/link';

export default class TodoFooter extends React.Component {
    pluralize(count, word) {
        return count === 1 ? word : word + 's';
    }

    render() {
        var activeTodoWord = this.pluralize(this.props.todoCount, 'item');
        return (
            <div className="filters">
                <div className="todo-count">{this.props.todoCount} {activeTodoWord} left</div>
                <div className="stats-link"><Link prefetch href="/stats"><a>stats</a></Link></div>
                <style jsx>{`
                    .filters {
                        color: #777;
                        padding: 5px 15px 30px 15px;
                        height: 20px;
                        text-align: center;
                        border-top: 1px solid #e6e6e6;
                        font-size: 14px;
                    }
                    .todo-count {
                        float: left;
                        text-align: left;
                    }
                    .stats-link {
                        float: right;
                        text-align: right;
                    }
                `}</style>
            </div>
        );
    }
}
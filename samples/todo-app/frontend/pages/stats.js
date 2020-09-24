import React from 'react';
import Link from 'next/link'
import fetch from 'isomorphic-fetch'
import '../public/static/index.css'

export default class Stats extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            stats: {
                todosCreated: null,
                todosCompleted: null,
                todosDeleted: null
            }
        };
    }

    async callStatsApi(method, routeUrl, body) {
        const url = routeUrl;
        const res = await fetch(url, {
            method: method,
            cache: 'no-cache',
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            },
            body: JSON.stringify(body)
        });

        const contentType = res.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return await res.json();
        }
        else {
            return res.text();
        }
    }

    async getStats() {
        const data = await this.callStatsApi("GET", "/api/stats");
        if (data) {
            this.setState({ stats: data });
        }
    }

    async componentDidMount() {
        await this.getStats();
    }

    render() {
        return (
            <div>
                <div className="container-fluid app-title">
                    <Link prefetch href="/">
                        <h1 className="app-title"><i className="fas fa-arrow-left"></i> todo <span className="no-color">stats</span></h1>
                    </Link>
                    <div className="row">
                        <div className="col">Created</div>
                        <div className="col">Completed</div>
                        <div className="col">Deleted</div>
                    </div>
                    <div className="row">
                        <div className="col todo-metric">{this.state.stats.todosCreated}</div>
                        <div className="col todo-metric">{this.state.stats.todosCompleted}</div>
                        <div className="col todo-metric">{this.state.stats.todosDeleted}</div>
                    </div>
                </div>
                <style jsx>{`
                    .container-fluid {
                        text-align:center;
                        max-width: 800px;
                    }
                    .app-title {
                        cursor: pointer;
                        width: 100%;
                        font-size: 96px;
                        font-weight: 100;
                        text-align: center;
                        color: rgba(175, 47, 47, 0.5);
                        -webkit-text-rendering: optimizeLegibility;
                        -moz-text-rendering: optimizeLegibility;
                        text-rendering: optimizeLegibility;
                        margin-bottom: 30px;
                    }
                    i {
                        font-size: 70px;
                    }
                    .no-color {
                        color: black;
                    }
                    .row {
                        font-size: 30px;
                        line-height: 1.4;
                    }
                    .todo-metric {
                        color: black;
                        font-size: 40px;
                    }
                `}</style>
            </div>
        );
    }
}
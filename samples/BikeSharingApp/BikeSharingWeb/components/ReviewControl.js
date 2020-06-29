// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Component } from 'react'
import Rating from 'react-rating'

export default class ReviewControl extends Component {

    constructor(props) {
        super(props);
        this.state = {value: 0};
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick(event) {
        this.setState({value: event});
    }

    render() {
        return (
            <h1>
                <Rating initialRating={this.state.value} onClick={this.handleClick}
                    emptySymbol={<i className="far fa-star"></i>}
                    fullSymbol={<i className="fas fa-star"></i>}
                />
                <style jsx>{`
                    h1 {
                        text-align: center;
                    }

                    .far, .fas {
                        margin: 6px;
                        margin-bottom: 15px;
                    }

                    @media only screen and (max-width: 340px) {
                        h1 {
                            font-size: 34px;
                        }
                    }
                `}</style>
            </h1>
        )
    }
}
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Component } from 'react'
import Page from "../components/Page"
import Header from "../components/Header"
import Content from "../components/Content"
import FormButton from "../components/FormButton"
import Footer from '../components/Footer'
import MediaQuery from 'react-responsive'
import helpers from '../lib/helpers';
import Router from 'next/router'
import ReviewControl from "../components/ReviewControl"
import ErrorPanel from '../components/ErrorPanel'

export default class Review extends Component {

    constructor(props) {
        super(props);
        this.state = {
            userName: undefined,
            errorMessage: undefined
        };
    }

    async componentDidMount() {
        let user = null;
        try {
            this.apiHost = await helpers.getApiHostAsync();
            user = await helpers.verifyUserAsync(this.apiHost);
            if (!user) {
                Router.push('/devsignin');
                return;
            }
        }
        catch (error) {
            console.error(error);
            this.setState({errorMessage: `Error while retrieving current user's data. Make sure that your Gateway and Users services are up and running. Details: ${error.message}`});
            return;
        }

        this.setState({
            userName: user.name
        });
    }

    // handle return bike
    async handleClick(context) {
        // return bike
        console.log("submitting review...");

        // navigate to review
        Router.push("/");
    }

    render() {
        return (
            <Page>
                <Header userName={this.state.userName} />
                <Content>
                    <div className="container-fluid details-container">
                        <div className="review-control">
                            <ReviewControl />
                        </div>
                        <div className="row">
                            <div className="col col-sm-3"><FormButton onClick={this.handleClick.bind(this)}>Comfortable</FormButton></div>
                            <div className="col col-sm-3"><FormButton onClick={this.handleClick.bind(this)}>Good brakes</FormButton></div>
                            <div className="col col-sm-3"><FormButton onClick={this.handleClick.bind(this)}>Easy pick-up</FormButton></div>
                            <div className="col col-sm-3"><FormButton onClick={this.handleClick.bind(this)}>Smooth ride</FormButton></div>
                        </div>
                        <textarea placeholder="Additional notes"></textarea>

                        <MediaQuery minWidth={600}>
                            <div className="divider">
                                <FormButton primary onClick={this.handleClick.bind(this)}>Submit</FormButton>
                            </div>
                        </MediaQuery>
                    </div>
                    <ErrorPanel errorMessage={this.state.errorMessage} />
                </Content>
                <MediaQuery maxWidth={600}>
                    <Footer>
                        <FormButton primary onClick={this.handleClick.bind(this)}>Submit</FormButton>
                    </Footer>
                </MediaQuery>
                <style jsx>{`
                    .divider {
                        padding-top: 30px;
                    }

                    textarea {
                        width: 100%;
                        height: 295px;
                        border-color: #C4C4C4;
                        margin-top: 10px;
                        resize: none;
                        padding: 5px;
                    }

                    .review-control {
                        padding-top: 25px;
                        padding-bottom: 8px;
                    }

                    .details-container {
                        text-align: center;
                    }

                    @media only screen and (min-width: 1024px) {
                        .details-container {
                            max-width: 800px;
                        }   
                    }
                `}</style>
            </Page>
        )
    }
}
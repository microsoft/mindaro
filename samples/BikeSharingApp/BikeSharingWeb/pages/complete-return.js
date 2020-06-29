// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import React, { Component } from 'react'
import Page from "../components/Page"
import Header from "../components/Header"
import Content from "../components/Content"
import Field from "../components/Field"
import FormNote from "../components/FormNote"
import FormButton from "../components/FormButton"
import Map from "../components/Map"
import Footer from '../components/Footer'
import MediaQuery from 'react-responsive'
import helpers from '../lib/helpers';
import Router from 'next/router'
import ErrorPanel from '../components/ErrorPanel'

export default class CompleteReturn extends Component {

    constructor(props) {
        super(props);
        this.state = {
            userId: undefined,
            userName: undefined,
            reservation: {},
            bike: {},
            invoice: {},
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
            userId: user.id,
            userName: user.name
        });

        let reservation = null;
        try {
            // get reservation
            var state = "Completed";
            reservation = await helpers.getReservationForUserAsync(user.id, this.apiHost, state);
            if (!reservation) {
                // Error, something's gone wrong, go home
                console.error("couldn't find " + state + " reservation, going to Index");
                Router.push("/");
                return;
            }
        }
        catch (error) {
            console.error(error);
            this.setState({errorMessage: `Error while retrieving current reservation's data. Make sure that your Gateway and Reservation services are up and running. Details: ${error.message}`});
            return;
        }

        this.setState({
            reservation: reservation
        });

        let bike = null;
        try {
            // get bike
            bike = await helpers.getBikeAsync(reservation.bikeId, this.apiHost);
        }
        catch (error) {
            console.error(error);
            this.setState({errorMessage: `Error while retrieving bike's data. Make sure that your Gateway and Bikes services are up and running. Details: ${error.message}`});
            return;
        }

        this.setState({
            bike: bike
        });

        let invoice = null;
        try {
            // get invoice
            invoice = await helpers.getInvoiceAsync(reservation.invoiceId, this.apiHost);
        }
        catch (error) {
            console.error(error);
            this.setState({errorMessage: `Error while retrieving invoice's data. Make sure that your Gateway and Billing services are up and running. Details: ${error.message}`});
            return;
        }

        this.setState({
            invoice: invoice
        });
    }

    // handle return bike
    async handleClick(context) {
        // return bike
        console.log("completing return...");
       
        // navigate to review
        Router.push("/review");
    }

    render() {
        return (
            <Page>
                <Header userName={this.state.userName} />
                <Content>
                    <div className="details-container">
                        <Map />
                        <div className="title" tabIndex="0">{this.state.bike.model ? `You're returning a ${this.state.bike.model}` : ``}</div>
                        <Field label="Pick-up/return address" value={this.state.bike.address} />
                        <div className="row">
                            <div className="col">
                                <Field label="Price per hour" value={this.state.bike.hourlyCost ? `$${this.state.bike.hourlyCost}` : ``} />
                                <FormNote text="Charging card ending with 1732" />
                            </div>
                            <div className="col">
                                <Field label="Total cost" value={this.state.invoice.amount ? `$${this.state.invoice.amount}` : ``} />
                            </div>
                        </div>
                        <MediaQuery minWidth={600}>
                            <div className="divider">
                                <FormButton primary onClick={this.handleClick.bind(this)}>Confirm return</FormButton>
                            </div>
                        </MediaQuery>
                    </div>
                    <ErrorPanel errorMessage={this.state.errorMessage} />
                </Content>
                <MediaQuery maxWidth={600}>
                    <Footer>
                        <FormButton primary onClick={this.handleClick.bind(this)}>Confirm return</FormButton>
                    </Footer>
                </MediaQuery>
                <style jsx>{`
                    .divider {
                        padding-top: 10px;
                    }

                    img {
                        width: 100%;
                        max-width: 400px;
                    }

                    .details-container {
                        padding-top: 11px;
                        letter-spacing: 0.5px;
                    }

                    .title {
                        font-size: 18px;
                        padding-top: 10px;
                        letter-spacing: 1px;
                        font-weight: 600;
                    }

                    .owner {
                        font-size: 13px;
                    }
                `}</style>
            </Page>
        )
    }
}
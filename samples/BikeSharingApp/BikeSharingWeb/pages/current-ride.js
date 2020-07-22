// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Component } from 'react'
import Page from "../components/Page"
import Header from "../components/Header"
import Content from "../components/Content"
import Field from "../components/Field"
import FormNote from "../components/FormNote"
import FormButton from "../components/FormButton"
import Map from "../components/Map"
import Footer from '../components/Footer'
import { withRouter } from 'next/router'
import fetch from 'isomorphic-fetch'
import MediaQuery from 'react-responsive'
import Router from 'next/router'
import helpers from '../lib/helpers';
import ErrorPanel from '../components/ErrorPanel'

class CurrentRideBase extends Component {

    constructor(props) {
        super(props);
        this.state = {
            userId: undefined,
            userName: undefined,
            reservation: {},
            bike: {},
            vendor: {},
            errorMessage: undefined,
            isLoaded: false
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
            var state = "Booked";
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

        let vendor = null;
        try {
            // get vendor
            vendor = await helpers.getVendorAsync(bike.ownerUserId, this.apiHost);
        }
        catch (error) {
            console.error(error);
            this.setState({errorMessage: `Error while retrieving bike's vendor's data. Make sure that your Gateway and Users services are up and running. Details: ${error.message}`});
            return;
        }

        this.setState({
            isLoaded: true,
            vendor: vendor
        });
    }

    // handle return bike
    async handleClick(context) {
        // return bike
        console.log("returning bike...");
        try {
            var url = this.apiHost + '/api/reservation/' + this.state.reservation.reservationId;
            const res = await fetch(url, {
                method: 'POST',
                cache: 'no-cache',
                headers: {
                    "Content-Type": "application/json; charset=utf-8"
                }
            });

            if (!res.ok) {
                throw new Error(await res.text());
            }

            // return confirmation
            const data = await res.json();
            console.log(data);
        }
        catch (error) {
            console.error(error);
            this.setState({errorMessage: `Error while creating a reservation for the bike. Make sure that your Gateway and ReservationEngine services are up and running. Details: ${error.message}`});
            return;
        }
        
        // navigate to complete-return
        Router.push("/complete-return");
    }

    render() {
        return (
            <Page>
                <Header userName={this.state.userName} />
                <Content>
                    <div className="row">
                        <div className="col-sm-6">
                            {this.state.bike.imageUrl != null &&
                                <img src={this.state.bike.imageUrl} alt="photo of bike" />
                            }
                        </div>
                        <div className="col-sm-6">
                            <div className="details-container">
                                {this.state.bike.model != null &&
                                    <div className="title" tabIndex="0">You've rented a {this.state.bike.model}</div>
                                }
                                {this.state.vendor.name != null &&
                                    <div className="owner" tabIndex="0">Owned by {this.state.vendor.name}</div>
                                }
                                <div className="row">
                                    <div className="col">
                                        <Field label="Price per hour" value={this.state.bike.hourlyCost ? `$${this.state.bike.hourlyCost}` : ``} />
                                        <FormNote text="Charging card ending with 1732" />
                                    </div>
                                </div>
                                <Field label="Pick-up/return address" value={this.state.bike.address} />
                                <MediaQuery minWidth={600}>
                                    <div className="divider">
                                        <FormButton primary disabled={!this.state.isLoaded} onClick={this.handleClick.bind(this)}>Return bike</FormButton>
                                    </div>
                                </MediaQuery>
                            </div>
                        </div>
                        <div className="col">
                            <Map />
                        </div>
                    </div>
                    <ErrorPanel errorMessage={this.state.errorMessage} />
                </Content>
                <MediaQuery maxWidth={600}>
                    <Footer>
                        <FormButton primary disabled={!this.state.isLoaded} onClick={this.handleClick.bind(this)}>Return bike</FormButton>
                    </Footer>
                </MediaQuery>
                <style jsx>{`
                    .divider {
                        padding-top: 10px;
                    }

                    img {
                        padding-top: 11px;
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

                    @media only screen and (min-width: 600px) {
                        .title {
                            font-size: 18px;
                            padding-top: 0px;
                            letter-spacing: 1px;
                            font-weight: 600;
                        }   
                    }
                `}</style>
            </Page>
        )
    }
}

const CurrentRide = withRouter(CurrentRideBase);

export default CurrentRide
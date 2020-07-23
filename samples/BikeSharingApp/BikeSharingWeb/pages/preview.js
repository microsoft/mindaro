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
import MediaQuery from 'react-responsive'
import fetch from 'isomorphic-fetch'
import Router from 'next/router'
import helpers from '../lib/helpers';
import ErrorPanel from '../components/ErrorPanel'

class PreviewBase extends Component {

    constructor(props) {
        super(props);
        this.state = {
            userId: undefined,
            userName: undefined,
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

        let bikeData = null;
        try {
            // get bike
            bikeData = await helpers.getBikeAsync(this.props.bikeId, this.apiHost);
        }
        catch (error) {
            console.error(error);
            this.setState({errorMessage: `Error while retrieving bike's data. Make sure that your Gateway and Bikes services are up and running. Details: ${error.message}`});
            return;
        }

        this.setState({
            bike: bikeData
        });

        let vendorData = null;
        try {
            // get vendor
            vendorData = await helpers.getVendorAsync(bikeData.ownerUserId, this.apiHost);
        }
        catch (error) {
            console.error(error);
            this.setState({errorMessage: `Error while retrieving bike's vendor's data. Make sure that your Gateway and Users services are up and running. Details: ${error.message}`});
            return;
        }

        this.setState({
            isLoaded: true,
            vendor: vendorData
        });
    }

    static async getInitialProps(context) {
        return {
            bikeId: context.query.id
        }
    }

    async handleClick(context) {
        // reserve bike
        console.log("Reserving bike...");
        try {
            var url = this.apiHost + '/api/reservation';
            const res = await fetch(url,
            {
                method: 'POST',
                cache: 'no-cache',
                headers: {
                    "Content-Type": "application/json; charset=utf-8"
                },
                body: JSON.stringify({
                    userId: this.state.userId,
                    bikeId: this.state.bike.id
                })
            });

            if (!res.ok) {
                throw new Error(await res.text());
            }

            // confirm reservation
            const data = await res.json();
            console.log("Reservation data:", data);
        }
        catch (error) {
            console.error(error);
            this.setState({errorMessage: `Error while creating a reservation for the bike. Make sure that your Gateway and ReservationEngine services are up and running. Details: ${error.message}`});
            return;
        }

        // navigate to current-ride
        Router.push("/current-ride");
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
                                <div className="title" tabIndex="0">{this.state.bike.model}</div>
                                {this.state.vendor.name != null &&
                                    <div className="owner" tabIndex="0">Owned by {this.state.vendor.name}</div>
                                }
                                <Field label="Price per hour" value={this.state.bike.hourlyCost ? `$${this.state.bike.hourlyCost}` : ``} />
                                <FormNote text="Charging card ending with 1732" />
                                <Field label="Suggested rider height (meters)" value={this.state.bike.suitableHeightInMeters} />
                                <Field label="Max weight (kg)" value={this.state.bike.maximumWeightInKg} />
                                <Field label="Pick-up/return address" value={this.state.bike.address} />

                                <MediaQuery minWidth={600}>
                                    <div className="divider">
                                        <FormButton primary disabled={!this.state.isLoaded} onClick={this.handleClick.bind(this)}>Rent bike</FormButton>
                                        <FormNote text="*You won't be charged until you return the bike" />
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
                        <FormButton primary disabled={!this.state.isLoaded} onClick={this.handleClick.bind(this)}>Rent bike</FormButton>
                        <FormNote text="*You won't be charged until you return the bike" />
                    </Footer>
                </MediaQuery>
                <style jsx>{`
                    .footer-content {
                        width: 80%;
                        margin-left: auto;
                        margin-right: auto;
                    }

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

const Preview = withRouter(PreviewBase);

export default Preview
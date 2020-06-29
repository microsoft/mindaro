// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Component } from 'react'
import Page from "../components/Page"
import Header from "../components/Header"
import Content from "../components/Content"
import Link from 'next/link'
import BikeCard from "../components/BikeCard"
import fetch from 'isomorphic-fetch'
import Router from 'next/router'
import helpers from '../lib/helpers';
import ErrorPanel from '../components/ErrorPanel'

export default class Index extends Component {

    constructor(props) {
        super(props);
        this.state = {
            userId: undefined,
            userName: undefined,
            bikes: [],
            errorMessage: undefined
        };
    }

    async componentDidMount() {
        try {
            this.apiHost = await helpers.getApiHostAsync();
            var user = await helpers.verifyUserAsync(this.apiHost);
            if (!user) {
                Router.push('/devsignin');
                return;
            }

            // User exists.
            this.setState({ userId: user.id, userName: user.name });
            console.log(this.state.userId);
        }
        catch (error) {
            console.error(error);
            this.setState({errorMessage: `Error while retrieving current user's data. Make sure that your Gateway and Users services are up and running. Details: ${error.message}`});
            return;
        }

        try {
            // Fetch user state, then navigate appropriately.
            var url = this.apiHost + '/api/user/' + this.state.userId + '/reservations';
            const reservationsResponse = await fetch(url);
            const reservations = await reservationsResponse.json();
            if (reservations.findIndex(function(r) { return r.state == 'Booked' }) >= 0) {
                console.log('Navigating to reserved bike...');
                Router.push("/current-ride");
                return;
            }
        }
        catch (error) {
            console.error(error);
            this.setState({errorMessage: `Error while retrieving bikes' reservations. Make sure that your Gateway and Reservation services are up and running. Details: ${error.message}`});
            return;
        }

        try {
            console.log("fetching list of bikes...");
            var url = this.apiHost + '/api/bike/availableBikes';
            const res = await fetch(url);
            const bikes = await res.json();
            this.setState({ bikes: bikes });
            console.log(bikes);
        }
        catch (error) {
            console.error(error);
            this.setState({errorMessage: `Error while retrieving bikes' data. Make sure that your Gateway and Bikes services are up and running. Details: ${error.message}`});
            return;
        }
    }

    render() {
        function isEven(index) {
            return (index % 2);
        }

        function isOdd(index) {
            return !isEven(index);
        }

        function listBikes(bikes, func) {
            return (
                bikes.map(function (bike, index) {
                    if (func(index)) {
                        return (
                            <Link href={`/preview/${bike.id}`} key={bike.id}>
                                <div>
                                    <BikeCard id={bike.id} name={bike.model} address={bike.address} rate={bike.hourlyCost} imageUrl={bike.imageUrl} />
                                </div>
                            </Link>
                        );
                    }
                })
            );
        }

        return (
            <Page>
                <Header userName={this.state.userName} />
                <Content>
                    <div className="bikesListTitle" tabIndex="0">Bikes available in Seattle area</div>
                    <div className="bikesListSubtitle" tabIndex="0">A selection of bikes that are best suited for your preferences.</div>
                    <div className="row">
                        <div className="col-md-6">
                            {listBikes(this.state.bikes, isOdd)}
                        </div>
                        <div className="col-md-6">
                            {listBikes(this.state.bikes, isEven)}
                        </div>
                    </div>
                    <ErrorPanel errorMessage={this.state.errorMessage} />
                </Content>
                <style jsx>{`
                    .bikesListTitle {
                        font-size: 20px;
                        font-weight: bold;
                    }

                    .bikesListSubtitle {
                        font-size: 16px;
                        margin-bottom: 12px;
                    }
                `}</style>
            </Page>
        );
    }
}

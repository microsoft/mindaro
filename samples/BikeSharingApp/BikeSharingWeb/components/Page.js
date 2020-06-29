// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import Head from 'next/head'

const Page = (props) => (
    <div className="page">
        <Head>
            <title>Adventure Works Cycles</title>
            <meta name="viewport" content="initial-scale=1.0, width=device-width" />
            <link href="https://fonts.googleapis.com/css?family=Heebo" rel="stylesheet"></link>
            <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css" integrity="sha384-MCw98/SFnGE8fJT3GXwEOngsV7Zt27NXFoaoApmYm81iuXoPkFOJwJ8ERdknLPMO" crossOrigin="anonymous"></link>
            <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.5.0/css/solid.css" integrity="sha384-rdyFrfAIC05c5ph7BKz3l5NG5yEottvO/DQ0dCrwD8gzeQDjYBHNr1ucUpQuljos" crossOrigin="anonymous"></link>
            <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.5.0/css/regular.css" integrity="sha384-z3ccjLyn+akM2DtvRQCXJwvT5bGZsspS4uptQKNXNg778nyzvdMqiGcqHVGiAUyY" crossOrigin="anonymous"></link>
            <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.5.0/css/fontawesome.css" integrity="sha384-u5J7JghGz0qUrmEsWzBQkfvc8nK3fUT7DCaQzNQ+q4oEXhGSx+P2OqjWsfIRB8QT" crossOrigin="anonymous"></link>
        </Head>
        {props.children}
        <style jsx global>{`
            html, body { 
                font-family: 'Heebo', san-serif;
                color: #688379;
                min-width: 385px;
            }

            a, p, div, br {
                font-size: 14px;
            }
        `}</style>
    </div>
)

export default Page;
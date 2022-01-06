import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import { BrowserRouter, Link } from 'react-router-dom'
import { Route, Switch } from 'react-router'
import Empty from './Empty'
import Sections from './Sections'
import LinkBlock from './LinkBlock'

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter basename='/tidb-community-editor'>
      <div>
        <nav>
          <Link to="/">
            Full example
          </Link>

          <Link to="/empty">
            Empty example
          </Link>

          <Link to="/sections">
            Sections example
          </Link>

          <Link to="/linkblock">
            LinkBlock example
          </Link>
        </nav>

        <main>
          <Switch>
            <Route
              component={Empty}
              exact
              path="/empty"
            />

            <Route
              component={Sections}
              exact
              path="/sections"
            />

            <Route
              component={LinkBlock}
              exact
              path="/linkblock"
            />

            <Route
              component={App}
              path="/"
            />
          </Switch>
        </main>
      </div>
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById('root')
)

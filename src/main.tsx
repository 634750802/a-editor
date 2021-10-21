import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import { BrowserRouter, Link } from 'react-router-dom'
import { Route, Switch } from 'react-router'
import Empty from '@/Empty'
import Sections from '@/Sections'

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
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

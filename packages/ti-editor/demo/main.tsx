import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import { BrowserRouter, Link } from 'react-router-dom'
import { Route, Switch } from 'react-router'
import Empty from './Empty'
import LinkBlock from './LinkBlock'

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter basename='/tidb-community-editor'>
      <div>
        <main>
          <Switch>
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

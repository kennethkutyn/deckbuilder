import React            from 'react';
import AppLayout        from './layout/AppLayout.js';
import GoogleHelper     from './libs/GoogleHelper.js';

import {
  Typography, 
  message,
  Icon,
  Button,
  Result
} from 'antd';

import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect
} from "react-router-dom";

// Pages
import ChooseFolder from './layout/pages/ChooseFolder.js';
import DeckBuilder  from './layout/pages/DeckBuilder.js';
import SuccessPage  from './layout/pages/SuccessPage.js';

// CSS
import './App.css'; 

const {Text} = Typography;

class App extends React.Component {

  /**
   * Constructor
   * @param  {Object} props Properties that are passed into this component by parent
   * @return {null}
   */
  constructor(props) {
    super(props);

    // Set the initial state of the component
    this.state = {
      googleLoaded:       false,  // Whether the Google SDK has loaded yet
      loggedIn:           null,   // Whether the user is successfully logged in to Google or not
      team:               'se',   // This could be used in the future to build other team's decks
      folder:             null,   // This is the folder id for the chosen Drive folder
      googleUsername:     null,   // This is the user's name for the welcome message
      deckUrl:            null    // The ID of the new presentation so we can link to it at the end
    };

    // Load the Google Helper for use in this component
    this.googleHelper = new GoogleHelper();
  }

  /**
   * Called once the component is mounted in React
   * @return {null}
   */
  componentDidMount() {
    // Set up the Google Helper
    this.googleHelper.load()
    .then(() => {
      // Check if they user is already signed in
      if(this.googleHelper.isSignedIn) {
        // If they are logged in then we can go ahead and proceed
        this.afterLogin();
      }
      else {
        // If they aren't logged in we will update the state here
        // This will allow the component to show the default login for google button
        this.setState({
          loggedIn: false
        });
      }
    });
  }

  /**
   * Render this component in react
   * @return {React.Component} Renders the entire app
   */
  render() {
    // Set up the current state of the component for the rendering below
    // This is just to make the following code more manageable
    const { loggedIn, googleUsername, folder, deckUrl, team } = this.state;

    const folderName = (folder !== null) ? folder.name : "";

    return (
      <Router>
        <AppLayout
          username={googleUsername}
          folderName={folderName} 
        >
          {loggedIn ? (
            <Switch>
              <Route exact path="/" render={() => (
                  <Redirect to="/choose-folder"/>
              )}/>
              <Route path="/choose-folder">
                <ChooseFolder 
                  googleHelper={this.googleHelper} 
                  folderChosen={(folder) => this.handleFolderChosen(folder)}
                />
              </Route>
              <Route path="/deck-builder">
                <DeckBuilder 
                  team={team} 
                  googleHelper={this.googleHelper}
                  folder={folder}
                  seName={googleUsername}
                />
              </Route>
              <Route path="/success">
                <SuccessPage folderName={folderName} />
              </Route>
            </Switch>
          ) : (
            <React.Fragment>
              {loggedIn === null && (
                <Text type="secondary">
                  <Icon type="loading" /> &nbsp;
                  Checking Google login status
                </Text>
              )}

              {loggedIn === false && (
                <div className="steps-action" style={{marginTop: 25}}>
                  <Button type="primary" onClick={() => this.handleLogin()}>
                    Sign into Google
                  </Button>
                </div>
              )}
            </React.Fragment>
          )}
        </AppLayout>
      </Router>
    );
  }

  ///////////////////////////////////////
  // Google sign in and authentication //
  ///////////////////////////////////////

  /**
   * Once the user is logged into Google, set the state and progress to the next stage
   * @return {null}
   */
  handleLogin() {
    this.googleHelper.signIn()
    .then(() => {
      this.afterLogin();
    });
  }

  afterLogin() {
    // Get the google username and increment the step
    this.setState({
      googleUsername: this.googleHelper.getUsername(),
      loggedIn: true
    });

    // Send a visual message to tell user they're logged in
    message.success('Logged in as ' + this.state.googleUsername);
  }

  handleFolderChosen(folder) {
    this.setState({
      folder: folder
    });
  }
}

export default App;
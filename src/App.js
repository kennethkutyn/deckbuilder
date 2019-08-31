import React from 'react';
import './App.css';
import DeckBuilder from './libs/DeckBuilder.js';
import GoogleHelper from './libs/GoogleHelper.js';
import {
  Layout, 
  Menu, 
  Typography, 
  Steps, 
  Button, 
  message, 
  Icon, 
  Spin,
  Result
} from 'antd';
import logo from './logo.svg'

const {Header, Content} = Layout;
const {Title, Text} = Typography;
const {Step} = Steps;

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
      loggedIn:           null,   // Whether the user is successfully logged in to Google or not
      team:               'se',   // This could be used in the future to build other team's decks
      destinationFolder:  null,   // This is the folder id for the chosen Drive folder
      googleUsername:     null,   // This is the user's name for the welcome message
      current:            0,      // Current step - start at 0
      generating:         false,  // Are we currently in the process of generating a deck?
      generatingMessage:  "",     // The message we will show while we are generating the deck (will change over time)
      deckUrl:            null,   // The ID of the new presentation so we can link to it at the end
      notifsAllowed:      false,  // Whether notifications are allowed based on browser permissions
      shouldNotify:       true    // Whether the user wants us to notify them or not
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
        this.handleGoogleLogin();
      }
      else {
        // If they aren't logged in we will update the state here
        // This will allow the component to show the default login for google button
        this.setState({
          loggedIn: false
        });
      }
    });

    this.handleNotifications();
  }

  /**
   * Render this component in react
   * @return {React.Component} Renders the entire app
   */
  render() {
    // Set up the current state of the component for the rendering below
    // This is just to make the following code more manageable
    const current         = this.state.current,
          loggedIn        = this.state.loggedIn,
          googleUsername  = this.state.googleUsername,
          folderName      = this.state.destinationFolder ? this.state.destinationFolder.name : null,
          deckUrl         = this.state.deckUrl,
          team            = this.state.team,
          notifsAllowed   = this.state.notifsAllowed,
          shouldNotify    = this.state.shouldNotify;

    // TODO: Split this out into separate components for readability
    return (
      <Layout className="app">
        <Header>
          <img alt="" className="logo" src={logo} style={{height: 31, margin: '16px 24px 16px 0', float: 'left'}} />
          <Menu
            theme="dark"
            mode="horizontal"
            defaultSelectedKeys={['1']}
            style={{ lineHeight: '64px' }}
          >
            <Menu.Item key="1">DeckBuilder</Menu.Item>
          </Menu>
        </Header>
        <Content style={{ padding: '50px' }}>
          <div style={{ background: '#fff', padding: 24 }}>

            <Title 
              level={2}
              style={{marginBottom: 25}}
            >Optimizely SE Deck Builder</Title>

            <Steps size="small" current={current} style={{marginBottom: 25}}>
              <Step title="Login to Google" description={loggedIn ? "Hi, " + googleUsername : ""} />
              <Step title="Choose folder" description={folderName ? folderName : ""} />
              <Step title="Configure Slides" />
            </Steps>
            
            {/* Page for logging into Google */}
            {current === 0 && (
              <React.Fragment>
                {loggedIn === null && (
                  <Text type="secondary">
                    <Icon type="loading" /> &nbsp;
                    Checking Google login status
                  </Text>
                )}

                {loggedIn === false && (
                  <div className="steps-action" style={{marginTop: 25}}>
                    <Button type="primary" onClick={() => this.signInGoogle()}>
                      Sign into Google
                    </Button>
                  </div>
                )}
              </React.Fragment>
            )}

            {/* Page for choosing your folder */}
            {current === 1 && (
              <Text type="secondary">
                <Icon type="loading" /> &nbsp;
                Selecting folder
              </Text>
            )}

            {/* Page for configuring your slide deck */}
            {current === 2 && (
              <Spin tip={this.state.generatingMessage} spinning={this.state.generating}>
                <DeckBuilder 
                  team={team} 
                  generate={(values, chosenDecks, deletedDecks) => this.generateDeck(values, chosenDecks, deletedDecks)}
                  notificationsAllowed={notifsAllowed}
                  shouldNotify={shouldNotify}
                  notifyCallback={(shouldNotify) => this.shouldNotifyChanged(shouldNotify)}
                  seName={googleUsername}
                />
              </Spin>
            )}

            {/* Page for showing the result! */}
            {current === 3 && (
              <Result
                status="success"
                title="Your presentation is ready!"
                subTitle={"We have successfully configured your slide deck. You can find it in your Google Drive folder "+folderName+" or access it by clicking below:"}
                extra={[
                  <Button type="primary" href={deckUrl} target="_blank" key="open">
                    Open presentation
                  </Button>
                ]}
              />
            )}
          </div>
        </Content>
      </Layout>
    );
  }

  ///////////////////
  // Notifications //
  ///////////////////

  handleNotifications() {
    let permission = Notification.permission;

    if(permission === "default") {
      // Ask the customer to allow notifications
      Notification.requestPermission((permission) => {
        this.setState({
          notifsAllowed: (permission === "granted")
        })
      });
    }
    else {
      this.setState({
        notifsAllowed: (permission === "granted")
      })
    }
  }

  shouldNotifyChanged(shouldNotify) {
    this.setState({
      shouldNotify: shouldNotify
    });
  }

  ///////////////////////////////////////
  // Google sign in and authentication //
  ///////////////////////////////////////

  /**
   * Handle button click to sign into google
   * @return {null}
   */
  signInGoogle() {
    this.googleHelper.signIn()
      .then(() => {
        this.handleGoogleLogin();
      });
  }

  /**
   * Once the user is logged into Google, set the state and progress to the next stage
   * @return {null}
   */
  handleGoogleLogin() {
    // Get the google username and increment the step
    this.setState({
      googleUsername: this.googleHelper.getUsername(),
      current: this.state.current + 1,
      loggedIn: true
    });

    // Send a visual message to tell user they're logged in
    message.success('Logged in as ' + this.state.googleUsername);

    // Run the next step (choosing a folder)
    this.googleHelper.createPicker((data) => this.pickerCallback(data));
  }

  pickerCallback(data) {
    if (data.action === window.google.picker.Action.PICKED) {
      // Add foldername to the App state and increment stage
      this.setState({
        destinationFolder: data.docs[0],
        current: this.state.current + 1
      });
    }
  }

  ///////////////////////////////
  // Deck generating functions //
  ///////////////////////////////

  /**
   * Handle the "generate" button click and start processing the new
   *   presentation with google
   * @param  {object} values        The values returned by the form
   * @param  {array} originalDecks  The original list of decks from the
   *                                deckbuilder
   * @return {null}               
   */
  generateDeck(values, chosenDecks, deletedDecks) {
    // Set state so that we can show the loading spinner
    this.setState({
      generating: true,
      generatingMessage: "Copying master deck to new location"
    });

    // Get relevant variables from the values object
    const customerName  = values.customer_name;

    // Generate deck filename
    const filename = this.generateFilename(customerName);

    // Copy the master deck into the destination folder
    this.googleHelper.copyMasterDeck(filename, this.state.destinationFolder.id)
    .then((fileId) => {

      // Update the loading text on the spinner and the file ic
      this.setState({
        generatingMessage: "Accessing new presentation",
        deckUrl: "https://docs.google.com/presentation/d/" + fileId
      });

      // Get the presentation slides
      this.googleHelper.getPresentation(fileId)
      .then((masterDeck) => {

        // Update the loading text on the spinner
        this.setState({
          generatingMessage: "Configuring slides (this may take a while)"
        });

        // Get the slides out of this presentation
        const slides = masterDeck.slides;

        // Update the title slide with text from our DeckBuilder
        this.updateTitleAndAgendaSlides(fileId, slides, chosenDecks, values);

        // Check if we need to delete any slides
        if(deletedDecks.length > 0) {
          // Delete unnecessary slides
          this.deleteSlides(fileId, slides, deletedDecks)
          .then(() => { 
            // Call to finish
            this.finishedGenerating();
          });
        }
        else {
          // No slides need to be deleted, we can just finish
          this.finishedGenerating();
        }

      });

    });
  }

  /**
   * Generate a filename for the new deck
   * @param  {string} prepend The text to be prepended onto the filename
   * @return {string}         The new filename
   */
  generateFilename(prepend) {
    return prepend + " | Optimizely Overview";
  }

  /**
   * Update the title and agenda slides in the new presentation deck
   * @param  {string} fileId        The presentation's file id
   * @param  {array}  slides        A list of the slides in the presentation
   *                                deck
   * @param  {object} values        Values from the deckbuilder form that was
   *                                submitted
   * @param  {array}  originalDecks The original decks from our config file
   * @return {Promise}              Gets returned when the updates are made      
   */
  updateTitleAndAgendaSlides(fileId, slides, chosenDecks, values) {
    // Generate the agenda text
    let agendaInt   = 1;
    let agendaText  = "";
    for(const deck of chosenDecks) {
      agendaText += agendaInt + ". " + deck.title + "\n";
      agendaInt++;
    }

    // Generate the replacements we want to implement
    const replacements = [
      {
        slide: slides[0],
        searchString: "COMPANYNAME",
        replacementString: values.customer_name
      },
      {
        slide: slides[0],
        searchString: "AEName",
        replacementString: values.ae_name
      },
      {
        slide: slides[0],
        searchString: "SENAME",
        replacementString: values.se_name
      },
      {
        slide: slides[1],
        searchString: "AGENDAHERE",
        replacementString: agendaText
      }
    ];

    // Perform the replacements
    this.googleHelper.updateSlidesByReplacingText(fileId, replacements);
  }

  /**
   * Delete the slides that weren't chosen by the user
   * @param  {string}  fileId        The ID of the presentation deck that has been generated
   * @param  {array}   originalDecks The array of decks that we pulled from config
   * @param  {array}   chosenDecks   The list of decks that the user has chosen
   * @return {Promise}               A promise when the requests complete
   */
  deleteSlides(fileId, slides, deletedDecks) {
    return new Promise((resolve, reject) => {
      // Get the list of deletions - this can go straight into the request
      const deletions = this.generateDeletions(deletedDecks, slides)

      // Delete the decks
      this.googleHelper.deleteSlides(fileId, deletions)
      .then(() => resolve());
    });
  }

  /**
   * Generate array of slides to be deleted
   * @param  {array} originalDecks The original list of decks that have the
   *   offsets and slide lengths in them
   * @param  {array} chosenDecks   The list of decks that have been chosen by
   *   the user
   * @param  {array} slides        The slides from the new deck we retrieved
   *   from the Google API (this will have all of the slide ids in it for us
   *   to record)
   * @return {array}               Array of objects which will form the
   *   request to batch delete slides from the presentation 
   */
  generateDeletions(deletedDecks, slides) {
    // Create variable to store list of deletions
    let deletions = [];

    // Loop through all the original decks to see which ones we need to delete.
    for(const deckToDelete of deletedDecks) {
      // Start at the current deck's offset in the master deck 
      let currOffset = deckToDelete.offset;

      // Loop through each subsequent slide
      for(var j = 0; j < deckToDelete.slides; j++) {
        // Get the slide
        let slide = slides[currOffset];

        // Get the slide object id
        let objectId = slide.objectId;

        // Add it to be deleted
        deletions.push(objectId);

        // Increment the offset
        currOffset++;
      }
    }
    return deletions;
  }

  /**
   * Called once the presentation deck has finished generating
   * @return {null} 
   */
  finishedGenerating() {
    // Move the state on to the final screen
    this.setState({
      current: this.state.current + 1
    });

    // Check if the user wants to be notified
    if(this.state.shouldNotify) {
      // Send the notification
      let notif = new Notification("Optimizely Deck Builder", {
        "body": "Your deck is ready; click here to open",
        "icon": "https://upload.wikimedia.org/wikipedia/en/thumb/e/e9/Optimizely_Logo.png/220px-Optimizely_Logo.png"
      });

      // Override click function
      notif.onClick = function(event) {
        event.preventDefault(); // prevent the browser from focusing the Notification's tab
        window.open(this.state.deckUrl, "_blank");
      }
    }
  }
}

export default App;
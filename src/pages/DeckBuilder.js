import React from "react";
import { Redirect } from "react-router-dom";
import AnalyticsHelper from "../libs/AnalyticsHelper.js";
import NotificationHelper from "../libs/NotificationHelper.js";
import DeckGenerator, { generatorStatus } from "../libs/DeckGenerator.js";

import { Button, Form, Input, Row, Col, Checkbox, Spin, Modal } from "antd";

const statusMessages = {};
statusMessages[generatorStatus.BACKGROUND] =
  "Copying master deck to new location";
statusMessages[generatorStatus.ACCESSING_NEW_DECK] = "Reading new deck";
statusMessages[generatorStatus.CONFIGURING_SLIDES] =
  "Configuring slides (this may take some time)";

  let deckStructure = "https://v2-api.sheety.co/44196fd1597f3bc59741a5811a1ba212/csmDeckbuilder/se";
  const seMasterDeckStructure = 'https://v2-api.sheety.co/44196fd1597f3bc59741a5811a1ba212/csmDeckbuilder/se';
  const psscMasterDeckStructure = 'https://v2-api.sheety.co/44196fd1597f3bc59741a5811a1ba212/csmDeckbuilder/pssc';
  const csmMasterDeckStructure = 'https://v2-api.sheety.co/44196fd1597f3bc59741a5811a1ba212/csmDeckbuilder/csm';
  const dataMasterDeckStructure = 'https://v2-api.sheety.co/44196fd1597f3bc59741a5811a1ba212/csmDeckbuilder/data';
  const ab2MasterDeckStructure = 'https://v2-api.sheety.co/44196fd1597f3bc59741a5811a1ba212/csmDeckbuilder/ab'

class DeckBuilder extends React.Component {
  deckGenerator = null;

  /**
   * Constructor
   * @param  {Object} props Properties that are passed into this component by parent
   * @return {null}
   */
  constructor(props) {
    super(props);
    if(props.team == "se"){
      deckStructure = seMasterDeckStructure;
    } else if(props.team == "pssc"){
      deckStructure = psscMasterDeckStructure;
    } else if(props.team == "data"){
      deckStructure = dataMasterDeckStructure;
    } else if (props.team == "csm"){
      deckStructure = csmMasterDeckStructure;
    } else if (props.team == "ab2"){
      deckStructure = ab2MasterDeckStructure;
    } else {
      deckStructure = seMasterDeckStructure;
    }

    // Get notification helper instance
    this.notificationHelper = new NotificationHelper();

    // Set state of the form, decks is empty while we wait for the JSON to return with the list of sections.
    this.state = {
      decks: [], // The current decks that the user has selected, an empty array while we wait for the JSON to return
      indeterminate: false, // For the indeterminate state of the "check all" checkbox
      checkAll: false, // Whether all the checkboxes are checked or not
      checkedList: [], // The list of checked checkboxes (decks)
      logo: null, // The current logo (determined from the customer name)
      generating: false, // Should we be hiding the screen and showing a spinner?
      generatingMessage: null, // The message that should be shown when the deck is generating
      redirect: false, // Redirect to the last stage
      errorMessage: null,
      shouldNotify: this.notificationHelper.granted(), // Whether the checkbox for "notify" should be checked or not
      generatePoC: false
    };

    // Create an analytics helper
    this.analyticsHelper = new AnalyticsHelper(true);
  }

  componentDidMount() {
    // Fetch the deck sections and lengths from: https://docs.google.com/spreadsheets/d/1lAorVfpa8xeOMuT95lLj_I8YblvzMzy2-TlH1ttkn-A/edit#gid=0
    fetch(deckStructure).then(response => {
      response.json().then(data => {
        // Get the decks and prepare them
        
        let decks = [];
        let team = "";
        for (team in data) {
          decks = this.prepareDecks(data[team]);
        } 

        // Update the state of the form with the new decks
        this.setState({ decks });

        let deck;
        const defaultDecks = [];

        console.log(decks);

        for (deck in decks){
          if (decks[deck].isDefault == true){
            defaultDecks.push(parseInt(decks[deck].order));
          }
        }

        console.log(defaultDecks);

        //let checkedList = [1, 2, 4];

        this.setState({
          checkedList: defaultDecks
        });

      });
    });

    // Set up the deck generator and start it up:
    this.deckGenerator = new DeckGenerator(
      this.props.googleHelper,
      (update, info) => this.deckGeneratorUpdate(update, info),
      this.props.folder.id
    );
    this.deckGenerator.start(this.props.team);
  }

  /**
   * Render this component in react
   * @return {React.Component} Renders the entire app
   */
  render() {
    // Redirect if we've finished (to the success page)
    if (this.state.redirect)
      return (
        <Redirect
          push
          to={{
            pathname: "/success",
            state: { deckUrl: this.state.deckUrl }
          }}
        />
      );

    // Redirect if we don't have enough info
    if (!this.props.folder) return <Redirect to="/" />;

    const { getFieldDecorator } = this.props.form;
    const { generatingMessage, errorMessage, generating } = this.state;

    return (
      <Spin tip={generatingMessage} spinning={generating}>
        <Form hideRequiredMark={true} onSubmit={e => this.handleSubmit(e)}>
          {/* Error modal */}
          <Modal
            title="Oh no! There's been an error!"
            visible={errorMessage !== null}
            onOk={() => {
              this.setState({
                errorMessage: null
              });
            }}
          >
            <p>
              There has been an error. Please send the below error message to
              Ken K or Thomas C on slack!!
            </p>
            <pre>{errorMessage}</pre>
          </Modal>
          {/* End error modal */}

          <Row gutter={{ xs: 0, sm: 32 }}>
            <Col xs={24} sm={12} md={10} lg={8}>
              <Row gutter={16}>
                <Col span={18}>
                  <Form.Item label="Customer Name">
                    {getFieldDecorator("customer_name", {
                      rules: [
                        {
                          required: true,
                          message: "Please input a customer name!",
                          whitespace: true
                        }
                      ]
                    })(<Input onBlur={e => this.handleCompanyNameChange(e)} />)}
                  </Form.Item>
                </Col>
                <Col span={6}>
                  {typeof this.state.logo !== "undefined" && (
                    <img
                      alt=""
                      src={this.state.logo}
                      style={{
                        width: "100%"
                      }}
                    />
                  )}
                </Col>
              </Row>

              <Form.Item label="AE Name (Optional)">
                {getFieldDecorator("ae_name", {
                  rules: [
                    {
                      required: false,
                      message: "Please input an AE name!",
                      whitespace: true
                    }
                  ]
                })(<Input />)}
              </Form.Item>

              <Form.Item label="Your Name">
                {getFieldDecorator("se_name", {
                  rules: [
                    {
                      required: true,
                      message: "Please input your name!",
                      whitespace: true
                    }
                  ],
                  initialValue: this.props.seName
                })(<Input />)}
              </Form.Item>

              <Form.Item label="Sections">
                <Checkbox
                  indeterminate={this.state.indeterminate}
                  onChange={e => this.onCheckAllChange(e)}
                  checked={this.state.checkAll}
                >
                  Check all
                </Checkbox>
                {getFieldDecorator("decks", {
                  rules: [
                    {
                      validator: (rule, value, callback) => {
                        // Check that this is an array and that it has a length
                        if (typeof value === "object" && value.length > 0) {
                          callback();
                        }
                        // If it doesn't, return false to the callback
                        else {
                          callback(false);
                        }
                      },
                      message: "Please choose at least one slide template",
                      whitespace: true
                    }
                  ],
                  initialValue: this.state.checkedList
                })(
                  <Checkbox.Group
                    style={{ width: "100%" }}
                    onChange={checkedList => this.onChange(checkedList)}
                  >
                    {this.state.decks.map((value, index) => {
                      return (
                        <Row key={index}>
                          <Col span={24}>
                            <Checkbox value={value.order}>
                      {value.title} ({value.slides} slides)
                            </Checkbox>
                          </Col>
                        </Row>
                      );
                    })}
                  </Checkbox.Group>
                )}
              </Form.Item>

              {!this.notificationHelper.blocked() && (
                <Form.Item label="Notifications">
                  {getFieldDecorator("notify", {
                    valuePropName: "checked",
                    initialValue: this.state.shouldNotify
                  })(
                    <Checkbox onChange={e => this.notifyChange(e)}>
                      Notify me when done
                    </Checkbox>
                  )}
                </Form.Item>
              )}

              
              <Form.Item label="PoC">
                  {getFieldDecorator("PoC", {
                    valuePropName: "checked",
                    initialValue: this.state.shouldPoC
                  })(
                    <Checkbox onChange={e => this.pocChange(e)}>
                      Also generate a PoC Planner Template
                    </Checkbox>
                  )}
                </Form.Item>
              

            </Col>
          </Row>

          <div className="steps-action" style={{ marginTop: 25 }}>
            <Button htmlType="submit" type="primary">
              Generate Deck
            </Button>
          </div>
        </Form>
      </Spin>
    );
  }

  /**
   * Prepare the list of individual decks for the deckbuilder to handle
   * @param  {array} decks  The array of decks that we will use
   * @return {array}        The fixed/finished array of decks
   */
  prepareDecks(decks) {
    // Lets take the list of decks and add an "offset" to them so we can easily delete them in the future
    let currOffset = 0;
    for (var i = 0; i < decks.length; i++) {
      // Add the current offset into the decks array
      decks[i]["offset"] = currOffset;

      // Add the number of decks to the offset
      currOffset += decks[i].slides;
    }

    return decks;
  }

  /**
   * Handle the user checking/unchecking the "notify" checkbox
   * @param  {object} e Event object (get target with e.target)
   * @return {null}
   */
  notifyChange(e) {
    // If blocked we shouldn't be able to get here as the element shouldn't be shown
    if (this.notificationHelper.blocked()) {
      this.setState({ shouldNotify: false });
      return;
    }


    let checked = e.target.checked;

    // Check if the user wants notifications but doesn't have them enabled
    if (checked && !this.notificationHelper.granted()) {
      // We need to ask them to enable notifications
      this.notificationHelper.request().then(granted => {
        // We know the user wants notifications, so it's up to whether they enabled or not
        this.toggleNotifications(granted);
      });
    } else {
      // Either box unchecked (no notifications) or box checked
      // and user has already granted (want notifications)
      // so either way we can use the `checked` variable...
      this.toggleNotifications(checked);
    }
  }

  pocChange(e) {
    console.log(e);
    let checked = e.target.checked;
    this.togglePoC(checked);
    
  }

  toggleNotifications(onOff) {
    this.setState({
      shouldNotify: onOff
    });
  }

  togglePoC(onOff) {
    this.setState({
      generatePoC: onOff
    });
  }

  /**
   * Handle the user checking a deck checkbox on/off
   * @param  {array} checkedList Array of checkbox values
   * @return {null}
   */
  onChange(checkedList) {
    // Set the state of the component to reflect the checkboxes that have been ticked
    console.log(checkedList);
    this.setState({
      checkedList,
      indeterminate:
        !!checkedList.length && checkedList.length < this.state.decks.length,
      checkAll: checkedList.length === this.state.decks.length
    });
  }

  /**
   * Handle someone checking/unchecking the "check all" checkbox
   * @param  {object} e The checkbox event
   * @return {null}
   */
  onCheckAllChange(e) {
    // Get a list of all the checkbox values we need to tick
    const checkboxes = [];
    this.state.decks.map((value, index) => checkboxes.push(value.order));

    // Set all the checkboxes in the form to either on or off
    this.props.form.setFields({
      decks: {
        value: e.target.checked ? checkboxes : [] // Empty array means all boxes are unchecked
      }
    });

    // Set the state of the component
    this.setState({
      checkAll: e.target.checked,
      indeterminate: false,
      checkedList: e.target.checked ? checkboxes : []
    });
  }

  /**
   * Handle the user clicking "generate" or submitting the form
   * @param  {object} e The form submit event
   * @return {null}
   */
  handleSubmit(e) {
    // Stop the form from actually submitting
    e.preventDefault();
    // Validate the form (this returns either an error or the values from the form)
    this.props.form.validateFields((err, values) => {
      // Check that there's no error (the form will handle itself if there's an error)
      if (!err) {
        let deletedDecks = [],
          chosenDecks = [];

        // Run through the original decks and create new lists for chosen and deleted slides
        for (const deck of this.state.decks) {
          if (values.decks.indexOf(deck.order) < 0) {
            // This slide hasn't been chosen and should be added to deleted array
            deletedDecks.push(deck);
          } else {
            // This slide has been chosen so should be added to chosen array
            chosenDecks.push(deck);
          }
        }

        // Add the customer logo to the values array
        values.logo = this.state.logo;

        // Start the deck generator
        this.deckGenerator.generate(values, chosenDecks, deletedDecks, this.props.team, this.state.generatePoC, err => {
          this.setState({
            errorMessage: JSON.stringify(err, null, 1)
          });
        });


        // Set the state to loading so we hide the form
        this.setState({
          generating: true
        });

        // Track
        this.analyticsHelper.trackState("generate clicked");
      }
    });
  }

  /**
   * Handle when the company name changes and the field blurs
   * @param  {object} e The event from the blur event
   * @return {null}
   */
  handleCompanyNameChange(e) {
    // Get the value
    let partial = e.target.value;

    // Create an abort controller array
    if (typeof this.abortControllers_ === "undefined") {
      this.abortControllers_ = [];
    }

    // Lets abort all the earlier abortControllers
    for (const abortController of this.abortControllers_) {
      abortController.abort();
    }

    // Create a new abort controller for this fetch
    let abortController = new AbortController();

    // Fetch the autocomplete suggestions
    fetch(
      "https://autocomplete.clearbit.com/v1/companies/suggest?query=" + partial,
      {
        method: "get",
        signal: abortController.signal
      }
    )
      .then(response => response.json())
      .then(response => {
        // Get the first image
        let logo = response[0].logo;

        // Set the state
        this.setState({
          logo: logo
        });
      })
      .catch(err => {
        console.log("Error", err);
      });

    // Add this abort controller to the array to be aborted if necessary
    this.abortControllers_.push(abortController);
  }

  deckGeneratorUpdate(status, info) {
    // Set the loading spinner message
    if (typeof statusMessages[status] !== "undefined") {
      this.setState({
        generatingMessage: statusMessages[status]
      });
    }

    // Set deckURL when new deck has been accessed
    if (status === generatorStatus.ACCESSING_NEW_DECK) {
      this.setState({
        deckUrl: "https://docs.google.com/presentation/d/" + info.fileId
      });
    }

    // Complete deckbuilder when finished
    if (status === generatorStatus.FINISHED) {
      this.analyticsHelper.trackState("finished generating");

      // Send notification
      this.notificationHelper.notify(
        "Optimizely Deck Builder",
        "Your deck is ready; click here to open.",
        "https://upload.wikimedia.org/wikipedia/en/thumb/e/e9/Optimizely_Logo.png/220px-Optimizely_Logo.png",
        this.state.deckUrl
      );

      // Redirect to final stage
      this.setState({
        redirect: true
      });
    }
  }
}

export default Form.create()(DeckBuilder);

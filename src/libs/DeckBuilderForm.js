import React from 'react';
import decksImport from '../config/decks.json'; // TODO: pass slides from App.js??
import {Button, Form, Input, Row, Col, Checkbox} from 'antd';

class DeckBuilderForm extends React.Component {

  /**
   * Constructor
   * @param  {Object} props Properties that are passed into this component by parent
   * @return {null}
   */
  constructor(props) {
    super(props);

    // Get the right set of decks
    let decks = this.prepareDecks(decksImport.se); // TODO: Add functionality to change decks here

    // Set the state of this component
    this.state = {
      decks:          decks,                    // The current decks that the user has selected
      indeterminate:  false,                    // For the indeterminate state of the "check all" checkbox
      checkAll:       false,                    // Whether all the checkboxes are checked or not
      checkedList:    [],                       // The list of checked checkboxes (decks)
      shouldNotify:   this.props.shouldNotify,  // Whether the checkbox for "notify" should be checked or not
      logo:           null                      // The current logo (determined from the customer name)
    };
  }

  /**
   * Render this component in react
   * @return {React.Component} Renders the entire app
   */
  render() {
    const { getFieldDecorator } = this.props.form; 

    return (
      <Form hideRequiredMark={true} onSubmit={(e) => this.handleSubmit(e)}>
        <Row gutter={{xs: 0, sm: 32}}>
          <Col xs={24} sm={12} md={10} lg={8}>

            <Row gutter={16}>
              <Col span={18}>
                <Form.Item label="Customer Name">
                  {getFieldDecorator('customer_name', {
                    rules: [{ required: true, message: 'Please input a customer name!', whitespace: true }]
                  })(<Input onBlur={(e)=>this.handleCompanyNameChange(e)} />)}
                </Form.Item>
              </Col>
              <Col span={6}>
                {typeof this.state.logo !== "undefined" && (
                  <img 
                    src={this.state.logo} 
                    style={{
                      width: '100%'
                    }}
                  />
                )}
              </Col>
            </Row>

            <Form.Item label="AE Name">
              {getFieldDecorator('ae_name', {
                rules: [{ required: true, message: 'Please input an AE name!', whitespace: true }]
              })(<Input />)}
            </Form.Item>

            <Form.Item label="SE Name">
              {getFieldDecorator('se_name', {
                rules: [{ required: true, message: 'Please input an SE name!', whitespace: true }],
                initialValue: this.props.seName
              })(<Input />)}
            </Form.Item>

            <Form.Item label="Sections">
              <Checkbox
                indeterminate={this.state.indeterminate}
                onChange={(e) => this.onCheckAllChange(e)}
                checked={this.state.checkAll}
              >
                Check all
              </Checkbox>
              {getFieldDecorator('decks', {
                rules: [{
                  validator: (rule, value, callback) => {
                    // Check that this is an array and that it has a length
                    if(typeof value === "object" && value.length > 0){
                      callback();
                    }
                    // If it doesn't, return false to the callback
                    else {
                      callback(false);
                    }
                  }, 
                  message: 'Please choose at least one slide template', whitespace: true
                }]
              })(
                <Checkbox.Group style={{ width: '100%' }} onChange={(checkedList) => this.onChange(checkedList)}>
                  {this.state.decks.map((value, index) => {
                    return(
                      <Row key={index}>
                        <Col span={24}>
                          <Checkbox value={value.google_id}>{value.title}</Checkbox>
                        </Col>
                      </Row>
                    )
                  })}
                </Checkbox.Group>
              )}
            </Form.Item>

            {this.props.notificationsAllowed && (
              <Form.Item label="Notifications">
                {getFieldDecorator('notify', {
                  valuePropName: 'checked',
                  initialValue: this.state.shouldNotify
                })(
                  <Checkbox onChange={(e) => this.notifyChange(e)}>Notify me when done</Checkbox>
                )}
              </Form.Item>
            )}
          </Col>
        </Row>

        <div className="steps-action" style={{marginTop: 25}}>
          <Button htmlType="submit" type="primary">Generate Deck</Button> 
        </div>
      </Form>
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
    for(var i = 0; i < decks.length; i++) {
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
    // Call the delegae callback
    this.props.notifyCallback(e.target.checked);
  }

  /**
   * Handle the user checking a deck checkbox on/off
   * @param  {array} checkedList Array of checkbox values
   * @return {null}
   */
  onChange(checkedList) {
    // Set the state of the component to reflect the checkboxes that have been ticked
    this.setState({
      checkedList,
      indeterminate:  !!checkedList.length && checkedList.length < this.state.decks.length,
      checkAll:       checkedList.length === this.state.decks.length,
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
    this.state.decks.map((value, index) => checkboxes.push(value.google_id));

    // Set all the checkboxes in the form to either on or off
    this.props.form.setFields({
      decks: {
        value: e.target.checked ? checkboxes : [] // Empty array means all boxes are unchecked
      },
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
            chosenDecks  = [];

        // Run through the original decks and create new lists for chosen and deleted slides
        for(const deck of this.state.decks) {
          if(values.decks.indexOf(deck.google_id) < 0) {
            // This slide hasn't been chosen and should be added to deleted array
            deletedDecks.push(deck);
          }
          else {
            // This slide has been chosen so should be added to chosen array
            chosenDecks.push(deck);
          }
        }

        // Add the customer logo to the values array
        values.logo = this.state.logo; 

        // Callback to delegate
        this.props.generate(values, chosenDecks, deletedDecks);
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
    if(typeof this.abortControllers_ === "undefined") {
      this.abortControllers_ = [];
    }

    // Lets abort all the earlier abortControllers
    for(const abortController of this.abortControllers_) {
      abortController.abort();
    }

    // Create a new abort controller for this fetch
    let abortController = new AbortController();
    
    // Fetch the autocomplete suggestions
    fetch("https://autocomplete.clearbit.com/v1/companies/suggest?query=" + partial, {
      method: "get",
      signal: abortController.signal
    })
    .then((response) => response.json())
    .then((response) => {
      // Get the first image
      let logo = response[0].logo;

      // Set the state
      this.setState({
        logo: logo
      });
    })
    .catch((err) => {
      console.log("Error", err);
    });

    // Add this abort controller to the array to be aborted if necessary
    this.abortControllers_.push(abortController);
  }

}

export default Form.create()(DeckBuilderForm);

import React from 'react';
import decksImport from '../../config/decks.json'; // TODO: pass slides from App.js??
import {Button, Form, Input, Row, Col, Checkbox} from 'antd';

class DeckBuilder extends React.Component {

  constructor(props) {
    super(props);

    // Get the right set of decks
    let decks = decksImport.se; // We can introduce other decks for AEs and other teams in the future

    // Lets take the list of decks and add an "offset" to them so we can easily delete them in the future
    let currOffset = 0;
    for(var i = 0; i < decks.length; i++) {
      // Add the current offset into the decks array
      decks[i]["offset"] = currOffset;

      // Add the number of decks to the offset
      currOffset += decks[i].slides;
    }

    // Set the state of this component
    this.state = {
      decks:          decks,
      indeterminate:  false,
      checkAll:       false,
      checkedList:    [],
      shouldNotify:   this.props.shouldNotify
    };
  }

  render() {
    const { getFieldDecorator } = this.props.form;

    return (
      <Form hideRequiredMark={true} onSubmit={(e) => this.handleSubmit(e)}>
        <Row gutter={{xs: 0, sm: 32}}>
          <Col xs={24} sm={12} md={10} lg={8}>
            <Form.Item label="Customer Name">
              {getFieldDecorator('customer_name', {
                rules: [{ required: true, message: 'Please input a customer name!', whitespace: true }],
                initialValue: "Customer"
              })(<Input />)}
            </Form.Item>

            <Form.Item label="AE Name">
              {getFieldDecorator('ae_name', {
                rules: [{ required: true, message: 'Please input an AE name!', whitespace: true }],
                initialValue: "AE"
              })(<Input />)}
            </Form.Item>

            <Form.Item label="SE Name">
              {getFieldDecorator('se_name', {
                rules: [{ required: true, message: 'Please input an SE name!', whitespace: true }],
                initialValue: "SE"
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

  notifyChange(e) {
    this.props.notifyCallback(e.target.checked);
  }

  onChange(checkedList) {
    this.setState({
      checkedList,
      indeterminate: !!checkedList.length && checkedList.length < this.state.decks.length,
      checkAll: checkedList.length === this.state.decks.length,
    });
  }

  onCheckAllChange(e) {
    // Get a list of all the checkbox values we need to tick
    const checkboxes = [];
    this.state.decks.map((value, index) => checkboxes.push(value.google_id));

    this.props.form.setFields({
      decks: {
        value: e.target.checked ? checkboxes : []
      },
    }); 

    this.setState({
      checkAll: e.target.checked,
      indeterminate: false,
      checkedList: e.target.checked ? checkboxes : []
    });
  }

  handleSubmit(e) {
    e.preventDefault();
    
    // Get form values
    this.props.form.validateFields((err, values) => {
      if (!err) {
        let deletedDecks = [],
            chosenDecks  = [];

        // Run through the original decks and create new lists for
        // chosen and deleted slides
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

        this.props.generate(values, chosenDecks, deletedDecks);
      }
    });
  }

}

export default Form.create()(DeckBuilder);
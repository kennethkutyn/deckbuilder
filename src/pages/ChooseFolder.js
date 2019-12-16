import React from 'react';
import { Redirect } from "react-router-dom";

import {
  Typography,
  Icon,
  Button,
  Result
} from 'antd';

const {Text} = Typography;

class ChooseFolder extends React.Component {

  state = {
    redirect:       false,
    pickerShowing:  false
  };

  componentDidMount() {
    this.showPicker();
  }

  pickerCallback(data) {
    if (data.action === window.google.picker.Action.PICKED) {
      // Add foldername to the App state
      this.props.folderChosen(data.docs[0]);

      // Redirect the user to the next step
      this.setState({
        redirect: true
      });
    }
    else if(data.action === window.google.picker.Action.CANCEL) {
      this.setState({
        pickerShowing: false
      });
    }
  }

  showPicker() {
    this.props.googleHelper.createPicker((data) => this.pickerCallback(data));

    this.setState({
      pickerShowing: true
    });
  }

  render() {
    const { pickerShowing } = this.state;

    return this.state.redirect ? <Redirect push to="/deck-builder" /> : (
      <React.Fragment>
        {pickerShowing ? (
          <Text type="secondary">
            <Icon type="loading" /> &nbsp;
            Selecting folder
          </Text>
        ) : (
          <Result
            status="warning"
            title="You need to pick a folder to continue."
            extra={
              <Button type="primary" key="console" onClick={() => this.showPicker()}>
                Choose Folder
              </Button>
            }
          />
        )}
      </React.Fragment>
    );
  }

}

export default ChooseFolder;
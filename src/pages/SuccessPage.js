import React from "react";
import { Redirect, withRouter } from "react-router-dom";

import { Result, Button } from "antd";

class SuccessPage extends React.Component {
  render() {
    const location = this.props.location;
    const state = typeof location.state !== "undefined" ? location.state : {};
    const deckUrl = typeof state.deckUrl !== "undefined" ? state.deckUrl : null;

    if (!deckUrl) return <Redirect to="/" />;

    return (
      <Result
        status="success"
        title="Your presentation is ready!"
        subTitle={
          "We have successfully configured your slide deck. You can find it in your Google Drive folder " +
          this.props.folderName +
          " or access it by clicking below:"
        }
        extra={[
          <Button type="primary" href={deckUrl} target="_blank" key="open">
            Open presentation
          </Button>,
          <Button type="info" href="/" key="startover">
            Start Again
          </Button>
        ]}
      />
    );
  }
}

export default withRouter(SuccessPage);

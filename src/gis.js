import React, { Component } from "react";
import FormGroup from "@material-ui/core/FormGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import "./styles.css";
import Map from "./Map";

class GIS extends Component {
  constructor() {
    super();
    this.state = {
      //We assume we will cover two runways max
      singleRunWay: true
    };
  }
  handleChange = () => {
    const { singleRunWay: s } = this.state;

    this.setState({ singleRunWay: !s });
  };

  render() {
    const { singleRunWay } = this.state;
    return (
      <div>
        <FormGroup row>
          <FormControlLabel
            control={
              <Checkbox
                checked={!singleRunWay}
                onChange={this.handleChange}
                value="singleRunWay"
              />
            }
            label="Double Runway"
          />
        </FormGroup>
        <Map singleRunWay={singleRunWay} />
      </div>
    );
  }
}

export default GIS;

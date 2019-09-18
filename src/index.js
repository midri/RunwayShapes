import React from "react";
import ReactDOM from "react-dom";
import * as turf from "@turf/turf";
import Gis from "./gis";
import "./styles.css";

const mapStyles = {
  width: "100%",
  height: "100%"
};

function App() {
  var polygon = turf.polygon([
    [[-81, 41], [-88, 36], [-84, 31], [-80, 33], [-77, 39], [-81, 41]]
  ]);

  var center = turf.centerOfMass(polygon);
  console.log(center.geometry.coordinates);
  return (
    <div className="App">
      <h1>Map Stuff</h1>
      <h2>How it works:</h2>
      <p>
        Don't activate the double Runway at the beginning even if you have two{" "}
      </p>
      <p>
        Put Marker 0 on the lower end of the runway and Marker1 on the upper
        end
      </p>
      <p>Then click on get Center 1, this will change Marker 0 to Center 1</p>
      <p>
        Put Marker 0 on the lower end of the runway and Marker2 on the upper
        end,
      </p>
      <p>Then click on get Center 2, this will change Marker 0 to Center 2</p>
      <p>Click on Download shape file to get a zip file</p>
      <Gis />
    </div>
  );
}
const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);

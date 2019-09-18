import React, { Component } from "react";
import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Button";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import TextField from "@material-ui/core/TextField";
import { Map, GoogleApiWrapper, Marker, Polygon } from "google-maps-react";
import "./styles.css";
import * as geolib from "geolib";
import * as shpwrite from "shp-write";
import _ from "lodash";
import { makeStyles } from "@material-ui/core/styles";
import * as Where from "node-where";
import { LinearProgress } from "@material-ui/core";
import { algebra, Expression } from "algebra.js";
const {
  StandaloneSearchBox
} = require("react-google-maps/lib/components/places/StandaloneSearchBox");

const mapStyles = {
  width: "100%",
  height: "100%"
};

class MapContainer extends Component {
  constructor() {
    super();
    this.state = {
      //We assume we will cover two runways max
      singleRunWay: true,
      center1: [44.4719556, -73.1532783],
      Filename: "",
      Coordinates1: [
        { lat: null, long: null },
        { lat: null, long: null },
        { lat: null, long: null },
        { lat: null, long: null }
      ],
      Markers1: [
        { lat: 44.4719556, lng: -73.1532783, label: "Marker0" },
        { lat: 44.4719557, lng: -73.1532783, label: "Marker1" }
      ],
      Markers2: [
        { lat: 44.471956, lng: -73.153279, label: "Marker0" },
        { lat: 44.4719561, lng: -73.153292, label: "Marker2" }
      ],
      Coordinates2: [
        { lat: null, long: null },
        { lat: null, long: null },
        { lat: null, long: null },
        { lat: null, long: null }
      ]
    };
  }

  getBearing(Markers) {
    return geolib.getRhumbLineBearing(Markers[0], Markers[1]);
  }

  onText1Change = coord => e => {
    const { center1 } = this.state;
    if (_.isEqual(coord, "lat")) {
      center1[0] = e.target.value;
    } else if (_.isEqual(coord, "lng")) {
      center1[1] = e.target.value;
    }
    this.setState({
      center1,
      Markers1: [
        { lat: center1[0], lng: center1[1], label: "Marker0" },
        { lat: center1[0], lng: center1[1], label: "Marker1" }
      ],
      Markers2: [
        { lat: center1[0], lng: center1[1], label: "Marker0" },
        { lat: center1[0], lng: center1[1], label: "Marker2" }
      ]
    });
  };

  onLocationChange = e => {
    this.setState({ location: e.target.value });
  };

  onSearchLocation = () => {
    const { location, Markers1, Markers2 } = this.state;
    console.log("on search trigerred", location);
    let lat = Markers1[0].lat,
      lng = Markers1[0].lng,
      flag = 0;
    Where.is("location", (err, result) => {
      console.log("where called", result);
      console.log("error", err);
      if (result) {
        lat = result.get("lat");
        lng = result.get("lng");
        console.log(result);
        flag = 1;
      }
    });
    if (flag === 1) {
      this.setState({
        Markers1: [{ lat: lat, lng: lng }, { lat: lat, lng: lng }],
        Markers2: [{ lat: lat, lng: lng }, { lat: lat, lng: lng }]
      });
    }
  };

  setMapCenter = () => {
    let { Markers1, Markers2, center1 } = this.state;
    Markers1[0].lat = center1[0];
    Markers1[0].lng = center1[1];
    Markers2[0].lat = center1[0];
    Markers2[0].lng = center1[1];
    this.setState({ Markers1, Markers2 });
  };

  onMarker1DragEnd = (coord, index) => {
    const { Markers1 } = this.state;
    const { latLng } = coord;
    const lat = latLng.lat();
    const lng = latLng.lng();

    //console.log("newCorrdinates are: ", lat, lng);
    const markers = [...Markers1];
    markers[index] = { lat, lng, label: Markers1[index].label };
    this.setState({ Markers1: markers });
  };

  onMarker2DragEnd = (coord, index) => {
    const { Markers2 } = this.state;
    const { latLng } = coord;
    const lat = latLng.lat();
    const lng = latLng.lng();

    //console.log("newCorrdinates are: ", lat, lng);
    const markers = [...Markers2];
    markers[index] = { lat, lng, label: Markers2[index].label };
    this.setState({ Markers2: markers });
  };

  getLatitudeAndLongitude(pointOfReference, Distance, bearing) {
    // bearing his is Bearing+ Degrees
    let calc = geolib.computeDestinationPoint(
      pointOfReference,
      Distance,
      bearing
    );
    return { lat: calc.latitude, lng: calc.longitude };
  }

  calculateNewCoordinate(Markers) {
    let Bearing = this.getBearing(Markers);
    let newCoordinates = [];

    let UpperCenter = geolib.computeDestinationPoint(
      { latitude: Markers[0].lat, longitude: Markers[0].lng },
      5000,
      Bearing + 180
    );

    let LowerCenter = geolib.computeDestinationPoint(
      { latitude: Markers[0].lat, longitude: Markers[0].lng },
      5000,
      Bearing + 360
    );

    newCoordinates.push(
      this.getLatitudeAndLongitude(UpperCenter, 2500, Bearing + 90)
    );
    newCoordinates.push(
      this.getLatitudeAndLongitude(LowerCenter, 2500, Bearing + 90)
    );
    newCoordinates.push(
      this.getLatitudeAndLongitude(LowerCenter, 2500, Bearing + 270)
    );
    newCoordinates.push(
      this.getLatitudeAndLongitude(UpperCenter, 2500, Bearing + 270)
    );

    return newCoordinates;
  }

  setCenter1() {
    //console.log("setCenter1 called");
    const { Markers1 } = this.state;
    let Bearing = this.getBearing(Markers1);
    let markers = [...Markers1];

    let distance = geolib.getDistance(
      { latitude: markers[0].lat, longitude: markers[0].lng },
      { latitude: markers[1].lat, longitude: markers[1].lng }
    );

    //console.log("distance is", distance);
    let referencePoint = {
      latitude: markers[0].lat,
      longitude: markers[0].lng
    };

    //console.log("reference point is", referencePoint);
    let center = this.getLatitudeAndLongitude(
      referencePoint,
      distance / 2,
      Bearing
    );

    //console.log("center", center);

    markers[0] = {
      lat: center.lat,
      lng: center.lng,
      label: "center1"
    };
    this.setState({ Markers1: markers });
  }

  setCenter2() {
    //console.log("setCenter1 called");
    const { Markers2 } = this.state;
    let Bearing = this.getBearing(Markers2);
    let markers = [...Markers2];

    let distance = geolib.getDistance(
      { latitude: markers[0].lat, longitude: markers[0].lng },
      { latitude: markers[1].lat, longitude: markers[1].lng }
    );

    //console.log("distance is", distance);
    let referencePoint = {
      latitude: markers[0].lat,
      longitude: markers[0].lng
    };

    //console.log("reference point is", referencePoint);
    let center = this.getLatitudeAndLongitude(
      referencePoint,
      distance / 2,
      Bearing
    );

    //console.log("center", center);

    markers[0] = {
      lat: center.lat,
      lng: center.lng,
      label: "center2"
    };
    this.setState({ Markers2: markers });
  }

  fromObjectToArray = ObjectArray => {
    let arr = [];

    ObjectArray.forEach(e => {
      arr.push([e.lat, e.lng]);
    });
    return arr;
  };

  downloadShapeFile = () => {
    //console.log("fcn called");
    const { Markers1, Markers2, Filename } = this.state;
    const { singleRunWay } = this.props;

    let options = {
      folder: Filename === "" ? "myFiles" : Filename,
      types: {
        polygon: "polygons"
      }
    };

    let p1 = this.fromObjectToArray(this.calculateNewCoordinate(Markers1));
    let p2 = this.fromObjectToArray(this.calculateNewCoordinate(Markers2));
    console.log("coordinates calculated", p1);

    if (singleRunWay) {
      // a GeoJSON bridge for features
      shpwrite.download(
        {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "Polygon",
                coordinates: [[[...p1, p1[0]]]]
              },
              properties: {
                name: "DefaultName"
              }
            }
          ]
        },
        options
      );
    } else {
      shpwrite.download(
        {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "Polygon",
                coordinates: [[[...p1, p1[0]]]]
              },
              properties: {
                name: "DefaultName1"
              }
            },
            {
              type: "Feature",
              geometry: {
                type: "Polygon",
                coordinates: [[[...p2, p2[0]]]]
              },
              properties: {
                name: "DefaultName2"
              }
            }
          ]
        },
        options
      );
    }
  };

  renderOneMarker = () => {
    //console.log("singleRunway");
    const { Markers1 } = this.state;
    let polygon = this.calculateNewCoordinate(Markers1);
    return (
      <div>
        <Map
          google={this.props.google}
          zoom={14}
          style={mapStyles}
          initialCenter={{ lat: Markers1[0].lat, lng: Markers1[0].lng }}
        >
          {Markers1.map((marker, index) => {
            //console.log("singleRunway2");
            return (
              <Marker
                key={index}
                draggable={true}
                position={{ lat: marker.lat, lng: marker.lng }}
                label={marker.label}
                onDragend={(t, map, coord) =>
                  this.onMarker1DragEnd(coord, index)
                }
              />
            );
          })}
          <Polygon
            strokeColor={"#000000"}
            strokeOpacity={1.0}
            strokeWeight={2}
            paths={polygon}
            fillColor={"#FF0000"}
            fillOpacity={0.35}
          />
        </Map>
      </div>
    );
  };

  renderTwoMarkers = () => {
    const { Markers1, Markers2 } = this.state;
    let polygon2 = this.calculateNewCoordinate(Markers2);
    let polygon = this.calculateNewCoordinate(Markers1);

    //console.log("double Runway");
    return (
      <div>
        <Map
          google={this.props.google}
          zoom={14}
          style={mapStyles}
          initialCenter={{ lat: Markers1[0].lat, lng: Markers1[0].lng }}
        >
          {Markers1.map((marker, index) => {
            //console.log("singleRunway2");
            return (
              <Marker
                key={index}
                draggable={true}
                position={{ lat: marker.lat, lng: marker.lng }}
                label={marker.label}
                onDragend={(t, map, coord) =>
                  this.onMarker1DragEnd(coord, index)
                }
              />
            );
          })}
          <Polygon
            strokeColor={"#000000"}
            strokeOpacity={1.0}
            strokeWeight={2}
            paths={polygon}
            fillColor={"#FF0000"}
            fillOpacity={0.35}
          />
          {Markers2.map((marker, index) => {
            //console.log("doubleRunway2");
            return (
              <Marker
                key={index * 3}
                draggable={true}
                position={{ lat: marker.lat, lng: marker.lng }}
                label={marker.label}
                onDragend={(t, map, coord) =>
                  this.onMarker2DragEnd(coord, index)
                }
              />
            );
          })}
          <Polygon
            strokeColor={"#000000"}
            strokeOpacity={1.0}
            strokeWeight={2}
            paths={polygon2}
            fillColor={"#FF0000"}
            fillOpacity={0.35}
          />
        </Map>
      </div>
    );
  };

  render() {
    const { center1, Filename } = this.state;
    const { singleRunWay } = this.props;
    return (
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginTop: 20
          }}
        >
          <TextField
            id="standard-name"
            label="File Name"
            value={Filename}
            onChange={this.onNameFile()}
            margin="normal"
          />

          <Button variant="outlined" onClick={() => this.downloadShapeFile()}>
            Download shape file
          </Button>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginTop: 20
          }}
        >
          <TextField
            id="standard-name"
            label="Latitude"
            value={center1[0]}
            onChange={this.onText1Change("lat")}
            margin="normal"
          />
          <TextField
            id="Longitude"
            label="Longitude"
            value={center1[1]}
            onChange={this.onText1Change("lng")}
            margin="normal"
          />
          <Button variant="outlined" onClick={() => this.setMapCenter()}>
            Find Location
          </Button>
        </div>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Grid
              container
              spacing={1}
              direction="column"
              alignItems="flex-start"
            >
              <Grid item>
                <ButtonGroup
                  size="small"
                  aria-label="Small outlined button group"
                >
                  <Button onClick={() => this.setCenter1()}>get Center1</Button>
                  <Button
                    disabled={singleRunWay}
                    onClick={() => this.setCenter2()}
                  >
                    get Center2
                  </Button>
                </ButtonGroup>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        {singleRunWay ? this.renderOneMarker() : this.renderTwoMarkers()}
      </div>
    );
  }
}

export default GoogleApiWrapper({
  apiKey: "AIzaSyBnfH1tNEtATCViaiDKNJ9wCSE8Fvrzfc0"
})(MapContainer);

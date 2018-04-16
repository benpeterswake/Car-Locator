import { Component, ViewChild, ElementRef } from '@angular/core';
import { NavController, Platform, ToastController } from 'ionic-angular';
import * as firebase from 'firebase';
import { Geolocation } from '@ionic-native/geolocation';
import { Device } from '@ionic-native/device';
declare var google: any;

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  @ViewChild('map') mapElement: ElementRef;
  @ViewChild('directionsPanel') directionsPanel: ElementRef;
  map: any;
  markers = [];
  ref = firebase.database().ref('geolocations/');
  parked = false;
  constructor(public navCtrl: NavController,
    public platform: Platform,
    private geolocation: Geolocation,
    private device: Device,
    private toastCtrl: ToastController) {
    platform.ready().then(() => {
      this.initMap()
    });
  }

  initMap() {
    this.geolocation.getCurrentPosition().then((resp) => {
      let mylocation = new google.maps.LatLng(resp.coords.latitude,resp.coords.longitude);
      this.map = new google.maps.Map(this.mapElement.nativeElement, {
        zoom: 15,
        center: mylocation
      });
      this.addMarker(mylocation, 'assets/imgs/car2.png');
    });
  }

  addMarker(location, image) {
    let marker = new google.maps.Marker({
      position: location,
      map: this.map,
      icon: image
    });
    this.markers.push(marker);
    console.log(this.markers)
  }

  parkCar() {
    this.geolocation.getCurrentPosition().then((resp) => {
      let toast = this.toastCtrl.create({
        message: 'Your car location has been saved!',
        duration: 3000,
        position: 'top',
        cssClass: 'success'
      });
      toast.present();
      this.parked = true;
      this.starting = null;
      console.log(resp.coords.latitude)
      console.log(resp.coords.longitude)
      firebase.database().ref('/geolocation').set({
        lat: resp.coords.latitude,
        lng: resp.coords.longitude
      });
    });
  }

  startNavigating(){
    this.starting = true;
    this.parked = null;

    this.geolocation.getCurrentPosition().then((resp) => {

      let mylocation = new google.maps.LatLng(resp.coords.latitude,resp.coords.longitude);
      let directionsService = new google.maps.DirectionsService;
      let directionsDisplay = new google.maps.DirectionsRenderer;

      directionsDisplay.setMap(this.map);
      directionsDisplay.setPanel(this.directionsPanel.nativeElement);

      let locationRef = firebase.database().ref('/geolocation');
      locationRef.on('value', function(snapshot) {
        directionsService.route({
            origin: mylocation,
            destination: snapshot.val(),
            travelMode: google.maps.TravelMode['WALKING']
        }, (res, status) => {
            if(status == google.maps.DirectionsStatus.OK){
                directionsDisplay.setDirections(res);
            } else {
                console.warn(status);
            }
        });
      });
    });
  }

  deleteMarkers() {
    this.markers = [];
  }


}

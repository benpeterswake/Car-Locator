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
  ref = firebase.database().ref('/geolocation');
  parked = false;
  starting = false;
  lat;
  lng;
  alreadyParked;

  constructor(public navCtrl: NavController,
    public platform: Platform,
    private geolocation: Geolocation,
    private device: Device,
    private toastCtrl: ToastController) {
    platform.ready().then(() => {
      this.initMap();
      this.displayCar();
      this.ref.on('value', (data) => {
        if(data.val().current){
          this.alreadyParked = true
          console.log(data.val().current)
        }else{
          this.alreadyParked = false
        }
      });
    });
  }

  initMap() {
    this.geolocation.getCurrentPosition().then((resp) => {
      let mylocation = new google.maps.LatLng(resp.coords.latitude,resp.coords.longitude);
      this.map = new google.maps.Map(this.mapElement.nativeElement, {
        zoom: 18,
        center: mylocation
      });
      this.addMarker(mylocation, 'assets/imgs/location.png');
    });
  }

  addMarker(location, image) {
    let marker = new google.maps.Marker({
      position: location,
      map: this.map,
      icon: image
    });
    this.markers.push(marker);
  }

  setMapOnAll(map) {
    for (var i = 0; i < this.markers.length; i++) {
      this.markers[i].setMap(map);
    }
  }

  displayCar() {
    this.ref.on('value', data => {
      if(data.val().current === true){
        this.parked = true;
        this.starting = null;
        this.lat = data.val().lat;
        this.lng = data.val().lng;
        let image = 'assets/imgs/car2.png';
        let carlocation = new google.maps.LatLng(data.val().lat ,data.val().lng);
        this.addMarker(carlocation,image);
      }else{
        console.log('no car')
      }
    });
  }

   parkCar() {
    this.geolocation.getCurrentPosition().then((resp) => {
      this.parked = true;
      this.starting = false;
      if(this.alreadyParked === false){
        let toast = this.toastCtrl.create({
           message: 'Car successfully parked! Location has been saved.',
           duration: 3000,
           position: 'top',
           cssClass: 'success'
         });
        toast.present();
        firebase.database().ref('/geolocation').set({
            lat: resp.coords.latitude,
            lng: resp.coords.longitude,
            current: true
        });
      }else{
        console.log('already parked')
      }
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
      // directionsDisplay.setPanel(this.directionsPanel.nativeElement);
      this.ref.on('value', function(snapshot) {
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
    this.ref.set({
      current: false
    }).then(()=> {
      this.starting = false;
      this.parked = false;
      this.markers = [];
      this.initMap();
    });
  }

}

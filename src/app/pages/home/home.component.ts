import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  wallet = '0x7105d236BdA4Db17666807726D99B70b1da19def';
  price = '0.300102930 ETH';
  validationStatus = 'Aguardando';
  panelOpenState = false;
  constructor() { }

  ngOnInit(): void {
  }

}

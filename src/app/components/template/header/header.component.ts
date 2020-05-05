import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  myDate = Date.now();
  name = 'Danilo Falco!'; 
  balance = '0.55473300 ETH';

  constructor() { }

  ngOnInit(): void {
  }

}

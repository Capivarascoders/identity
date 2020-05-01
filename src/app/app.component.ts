import { Component, OnInit } from '@angular/core';
import { EthersContractService } from './services/ethers.contract.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'identity';
  public value: string;

  constructor(
    private etherContractService: EthersContractService
  ) {

  }

  ngOnInit(): void {

  }

  set() {
    this.etherContractService.set('new value 3');
  }

  get() {
    this.etherContractService.get().then((data) => {
      this.value = data;
    });
  }
}

import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { EthersContractService } from './services/ethers.contract.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NavComponent } from './components/template/nav/nav.component';
import { HeaderComponent } from './components/template/header/header.component';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MyWalletComponent } from './pages/my-wallet/my-wallet.component';
import { ValidationComponent } from './pages/validation/validation.component';
import { ExtractComponent } from './pages/extract/extract.component';
import { RequestLootComponent } from './pages/request-loot/request-loot.component'

@NgModule({
  declarations: [
    AppComponent,
    NavComponent,
    HeaderComponent,
    MyWalletComponent,
    ValidationComponent,
    ExtractComponent,
    RequestLootComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    NgbModule,
    MatToolbarModule
  ],
  providers: [
    EthersContractService
  ],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule { }

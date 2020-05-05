import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MyWalletComponent } from '../app/pages/my-wallet/my-wallet.component';
import { ExtractComponent } from '../app/pages/extract/extract.component';
import { RequestLootComponent } from '../app/pages/request-loot/request-loot.component';
import { ValidationComponent } from '../app/pages/validation/validation.component';

const routes: Routes = [
  { path: 'my-wallet', component: MyWalletComponent},
  { path: 'extract', component: ExtractComponent},
  { path: 'request-loot', component: RequestLootComponent},
  { path: 'validation', component: ValidationComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

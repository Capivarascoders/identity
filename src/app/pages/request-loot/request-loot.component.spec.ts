import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestLootComponent } from './request-loot.component';

describe('RequestLootComponent', () => {
  let component: RequestLootComponent;
  let fixture: ComponentFixture<RequestLootComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RequestLootComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RequestLootComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { Component, OnInit, Input } from '@angular/core';
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { UsersModal } from '../users-modal/users-modal.component';
import { PaymentModal } from '../payment-modal/payment-modal.component';
import { CostResultsModal } from '../cost-results-modal/cost-results-modal.component';

import { UserService } from '../services/user.service';

import { PaymentInfo } from '../models/paymentinfo';
import { DebtorInfo } from '../models/debtorinfo'; 

@Component({
  selector: 'app-main-table',
  templateUrl: './main-table.component.html',
  styleUrls: ['./main-table.component.css']
})
export class MainTableComponent implements OnInit {

  constructor(public modalService: NgbModal, private userService: UserService) { }
  
  @Input() userArray: string[] = [];
  @Input() paymentArray: PaymentInfo[] = [];

  costResult: Map<String, DebtorInfo[]> = new Map<String, DebtorInfo[]>();
  finalCostResult: Map<String, DebtorInfo[]>;

  checkboxValue: boolean = true;

  // Auto populate properties for table on load to make the page look nice
  emptyTableRows = [1,2,3,4,5];
  rowsAreEmpty: boolean = true;

  ngOnInit() {
    this.userService.userArray.subscribe(
      (response) => this.userArray = response
    );

    this.userService.paymentArray.subscribe(
      (response) => {
        this.paymentArray = response;
        this.rowsAreEmpty = false;
      }
    )
  }

  openAddUsersModal() {
    const modalRef = this.modalService.open(UsersModal, {size: "lg"});
  }

  openAddPaymentRowModal() {
    const modalRef = this.modalService.open(PaymentModal, {size: "lg"});
  }

  openCostResultsModal() {
    this.calculateCosts();
    const modalRef = this.modalService.open(CostResultsModal, {size: "lg"});
    modalRef.componentInstance.costResult = this.finalCostResult;
  }

  calculateCosts() {
    this.finalCostResult = new Map<String, DebtorInfo[]>();
    // Loop through the payment array and create the cost result mapping
    for (let item in this.paymentArray) {

      let currentPayer = this.paymentArray[item].payer;
      let currentItem = this.paymentArray[item].item;
      let debtorInfo: Array<DebtorInfo> = new Array<DebtorInfo>();
      console.log("INITIAL DEBTORINFO:", debtorInfo);
      // Loop through all the payees in the payment array
      for (let payee in this.paymentArray[item].payees) {
        //console.log("item is", item);
        let debtorName = this.paymentArray[item].payees[payee];
        let totalPrice = this.paymentArray[item].price;
        let numUsers = this.paymentArray[item].payees.length;
        //console.log("Payees array:", this.paymentArray[item]);
        // Create an array of debtor info with debtor name and money owed
        console.log(`debtor name is ${debtorName}, total price is ${totalPrice} and numUsers is ${numUsers}`);
        //console.log("total price is:", totalPrice);
        let debtorItem = new DebtorInfo(debtorName, (totalPrice/numUsers));
        console.log(debtorItem);
        debtorInfo.push(debtorItem);
        console.log("debtorInfo array after push:", debtorInfo, debtorInfo.length);
      }
      
      // Add each debtorInfo array to the costResult map along with the payer
      this.costResult.set(currentPayer + "-" + currentItem, debtorInfo);
    }

    //console.log(this.costResult);

    // Loop through map to reformat so that each payer is a key
    console.log("initial cost result", this.costResult.entries());
    let finalDebtorInfo: Array<DebtorInfo> = new Array<DebtorInfo>();

    this.costResult.forEach((value, key) => {
      let newKey = key.split('-')[0];
      // If key does not exist, where key is the name of the payer then add the name and the array
      if (this.finalCostResult.get(newKey) === undefined) {
        this.finalCostResult.set(newKey, value);
      }
      
      else {
        // Loop through arrays (debtorName, moneyOwed), try to find matching names, and update the final array
        for (let oldDebtorItem in value) {
          let newDebtorArray = this.finalCostResult.get(newKey);
          for (let finalDebtorItem in newDebtorArray) {
            if (value[oldDebtorItem].debtorName === newDebtorArray[finalDebtorItem].debtorName) {
              // Fix this later, can make into a couple lines code
              let oldCost = value[oldDebtorItem].moneyOwed;
              let newCost = oldCost + newDebtorArray[finalDebtorItem].moneyOwed;
              newDebtorArray[finalDebtorItem].moneyOwed = newCost;
              // console.log("old cost is:", oldCost);
              // console.log("new cost is:", newCost);
            }
          }

          this.finalCostResult.set(newKey, newDebtorArray);
        }
      }
    });
  }

  addUser(user, payer, item) {
    //console.log(user);
    //console.log(payer);

    // Loop through the payment array and add payees to each user
    for (let paymentInfo in this.paymentArray) {
      
      // If payer and item are the same, and the user doesn't already exist in the payees array, push the user
      if (this.paymentArray[paymentInfo].payer === payer && this.paymentArray[paymentInfo].item === item &&
          this.paymentArray[paymentInfo].payees.indexOf(user) === -1) {
        this.paymentArray[paymentInfo].payees.push(user);
      }
    }
  }

}

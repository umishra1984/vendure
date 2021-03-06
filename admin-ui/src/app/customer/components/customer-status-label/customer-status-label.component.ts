import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { Customer } from 'shared/generated-types';

@Component({
    selector: 'vdr-customer-status-label',
    templateUrl: './customer-status-label.component.html',
    styleUrls: ['./customer-status-label.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerStatusLabelComponent {
    @Input() customer: Customer.Fragment;
}

import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, Observable, of, Subject } from 'rxjs';
import { map, shareReplay, switchMap, takeUntil, tap } from 'rxjs/operators';
import { LanguageCode } from 'shared/generated-types';
import { CustomFieldConfig, CustomFields } from 'shared/shared-types';

import { ServerConfigService } from '../data/server-config';

import { getDefaultLanguage } from './utilities/get-default-language';

export abstract class BaseDetailComponent<Entity extends { id: string }> {
    entity$: Observable<Entity>;
    availableLanguages$: Observable<LanguageCode[]>;
    languageCode$: Observable<LanguageCode>;
    isNew$: Observable<boolean>;
    id: string;
    abstract detailForm: FormGroup;
    protected destroy$ = new Subject<void>();

    protected constructor(
        protected route: ActivatedRoute,
        protected router: Router,
        protected serverConfigService: ServerConfigService,
    ) {}

    init() {
        this.entity$ = this.route.data.pipe(
            switchMap(data => data.entity),
            tap<any>(entity => (this.id = entity.id)),
        );
        this.isNew$ = this.entity$.pipe(
            map(entity => entity.id === ''),
            shareReplay(1),
        );
        this.languageCode$ = this.route.paramMap.pipe(
            map(paramMap => paramMap.get('lang')),
            map(lang => (!lang ? getDefaultLanguage() : (lang as LanguageCode))),
        );

        this.availableLanguages$ = this.serverConfigService.getAvailableLanguages();

        combineLatest(this.entity$, this.languageCode$)
            .pipe(takeUntil(this.destroy$))
            .subscribe(([facet, languageCode]) => {
                this.setFormValues(facet, languageCode);
                this.detailForm.markAsPristine();
            });
    }

    destroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    setLanguage(code: LanguageCode) {
        this.setQueryParam('lang', code);
    }

    protected abstract setFormValues(entity: Entity, languageCode: LanguageCode): void;

    protected getCustomFieldConfig(key: keyof CustomFields): CustomFieldConfig[] {
        return this.serverConfigService.serverConfig.customFields[key] || [];
    }

    protected setQueryParam(key: string, value: any) {
        this.router.navigate(['./', { [key]: value }], {
            relativeTo: this.route,
            queryParamsHandling: 'merge',
        });
    }
}

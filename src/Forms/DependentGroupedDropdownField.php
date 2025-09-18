<?php

namespace Fromholdio\DependentGroupedDropdownField\Forms;

use Closure;
use Sheadawson\DependentDropdown\Forms\DependentDropdownField;
use Sheadawson\DependentDropdown\Traits\DependentFieldTrait;
use SilverStripe\Admin\LeftAndMain;
use SilverStripe\Control\Controller;
use SilverStripe\Forms\DropdownField;
use SilverStripe\View\Requirements;

class DependentGroupedDropdownField extends DependentDropdownField
{
    use DependentFieldTrait;

    public function __construct($name, $title = null, ?Closure $source = null, $value = '', $form = null, $emptyString = null)
    {
        parent::__construct($name, $title, $source, $value, $form, $emptyString);
        $this
            ->removeExtraClass('dependent-dropdown')
            ->addExtraClass('dependent-grouped-dropdown')
            ->addExtraClass('groupeddropdown');
    }

    public function Field($properties = [])
    {
        $field = DropdownField::Field($properties);

        if (!is_subclass_of(Controller::curr(), LeftAndMain::class)) {
            Requirements::javascript('silverstripe/admin:thirdparty/jquery-entwine/jquery.entwine.js');
        }

        Requirements::javascript(
            'fromholdio/silverstripe-dependentgroupeddropdownfield:client/js/dependentgroupeddropdown.js'
        );

        $this->setAttribute('data-link', $this->Link('load'));
        $this->setAttribute('data-depends', $this->getDepends()->getName());
        $this->setAttribute('data-empty', $this->getEmptyString());
        $this->setAttribute('data-unselected', $this->getUnselectedString());

        return $field;
    }
}

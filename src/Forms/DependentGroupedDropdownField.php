<?php

namespace Fromholdio\DependentGroupedDropdownField\Forms;

use Closure;
use Sheadawson\DependentDropdown\Forms\DependentDropdownField;
use Sheadawson\DependentDropdown\Traits\DependentFieldTrait;
use SilverStripe\Admin\LeftAndMain;
use SilverStripe\Control\Controller;
use SilverStripe\Core\ArrayLib;
use SilverStripe\Forms\DropdownField;
use SilverStripe\Model\ArrayData;
use SilverStripe\Model\List\ArrayList;
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

        return DropdownField::Field($properties);
    }

    /**
     * Build a potentially nested fieldgroup
     *
     * @param mixed $valueOrGroup Value of item, or title of group
     * @param string|array $titleOrOptions Title of item, or options in grouip
     * @return ArrayData Data for this item
     */
    protected function getFieldOption($valueOrGroup, $titleOrOptions)
    {
        // Return flat option
        if (!is_array($titleOrOptions)) {
            return parent::getFieldOption($valueOrGroup, $titleOrOptions);
        }

        // Build children from options list
        $options = new ArrayList();
        foreach ($titleOrOptions as $childValue => $childTitle) {
            $options->push($this->getFieldOption($childValue, $childTitle));
        }

        return new ArrayData([
            'Title' => $valueOrGroup,
            'Options' => $options
        ]);
    }

    public function Type()
    {
        return 'dependentgroupeddropdown groupeddropdown dropdown';
    }

    public function getSourceValues()
    {
        // Flatten values
        $values = [];
        $source = $this->getSource();
        array_walk_recursive(
            $source,
            // Function to extract value from array key
            function ($title, $value) use (&$values) {
                $values[] = $value;
            }
        );
        return $values;
    }

    public function performReadonlyTransformation()
    {
        $field = parent::performReadonlyTransformation();
        $field->setSource(ArrayLib::flatten($this->getSource()));
        return $field;
    }
}

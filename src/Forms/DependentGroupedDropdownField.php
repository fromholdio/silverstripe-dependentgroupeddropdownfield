<?php

namespace Fromholdio\DependentGroupedDropdownField\Forms;

use SilverStripe\Control\HTTPResponse;
use SilverStripe\Core\Convert;
use SilverStripe\Forms\FormField;
use SilverStripe\Forms\GroupedDropdownField;
use SilverStripe\ORM\Map;
use SilverStripe\View\Requirements;

class DependentGroupedDropdownField extends GroupedDropdownField {

    private static $allowed_actions = [
        'load'
    ];

    protected $depends;
    protected $unselected;
    protected $sourceCallback;

    public function __construct($name, $title = null, ?callable $source = null, $value = '', $form = null, $emptyString = null)
    {
        parent::__construct($name, $title, [], $value);

        if (is_null($source)) {
            throw new \UnexpectedValueException(
                'You must provide a callable $source value to ' . static::class . '.'
            );
        }

        // we are unable to store Closure as a normal source
        $this->sourceCallback = $source;
        $this
            ->addExtraClass('dependent-grouped-dropdown')
            ->addExtraClass('groupeddropdown')
            ->addExtraClass('dropdown');
    }

    public function load($request)
    {
        $response = new HTTPResponse();
        $response->addHeader('Content-Type', 'application/json');

        $items = call_user_func($this->sourceCallback, $request->getVar('val'));
        $results = [];
        if ($items) {
            foreach ($items as $k => $v) {
                $results[] = ['k' => $k, 'v' => $v];
            }
        }

        $response->setBody(json_encode($results));

        return $response;
    }

    public function getDepends()
    {
        return $this->depends;
    }

    public function setDepends(FormField $field)
    {
        $this->depends = $field;

        return $this;
    }

    public function getUnselectedString()
    {
        return $this->unselected;
    }

    public function setUnselectedString($string)
    {
        $this->unselected = $string;

        return $this;
    }

    public function getSource()
    {
        $val = $this->depends->Value();

        if (
            !$val
            && method_exists($this->depends, 'getHasEmptyDefault')
            && !$this->depends->getHasEmptyDefault()
        ) {
            $dependsSource = array_keys($this->depends->getSource());
            $val = isset($dependsSource[0]) ? $dependsSource[0] : null;
        }

        if (!$val) {
            $source = [];
        } else {
            $source = call_user_func($this->sourceCallback, $val);
            if ($source instanceof Map) {
                $source = $source->toArray();
            }
        }

        if ($this->getHasEmptyDefault()) {
            return ['' => $this->getEmptyString()] + (array) $source;
        } else {
            return $source;
        }
    }

    public function Field($properties = [])
    {
        Requirements::javascript('fromholdio/silverstripe-dependentgroupeddropdownfield:client/js/dependentgroupeddropdown.js');

        $this->setAttribute('data-link', $this->Link('load'));
        $this->setAttribute('data-depends', $this->getDepends()->getName());
        $this->setAttribute('data-empty', $this->getEmptyString());
        $this->setAttribute('data-unselected', $this->getUnselectedString());

        return parent::Field($properties);
    }

    public function Type()
    {
        return 'dependentgroupeddropdown groupeddropdown dropdown';
    }

}

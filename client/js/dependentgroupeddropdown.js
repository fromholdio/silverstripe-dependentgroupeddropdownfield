jQuery.entwine("dependentgroupeddropdown", function ($) {

    $(":input.dependent-grouped-dropdown").entwine({
        onmatch: function () {
            var drop = this;
            var dependsAttr = drop.data('depends');

            if (!dependsAttr) {
                return;
            }

            var fieldName = dependsAttr.replace(/[#;&,.+*~':"!^$[\]()=>|\/]/g, "\\$&");
            var depends = ($(":input[name=" + fieldName + "]"));
            var dependsTreedropdownfield = ($(".listbox[id$=" + fieldName + "]"));
            var isReactField = false;
            var displayError = function(data, element) {
                element.parent().append($("<div class='mt-1 mb-0 message error'/>").text(data.error));
            };

            this.parents('.field:first').addClass('dropdown');

            // If not found, try SearchableDropdownField by container ID
            if (depends.length === 0) {
                // SearchableDropdownField container has ID matching the field name
                // Try multiple possible form ID patterns
                var possibleIds = [
                    'Form_EditForm_' + fieldName,      // Standard CMS form
                    'ModalForm_' + fieldName,          // Modal form
                    'Form_ItemEditForm_' + fieldName,  // GridField edit form
                    fieldName                          // Just the field name
                ];

                var searchableContainer = null;
                for (var i = 0; i < possibleIds.length; i++) {
                    var container = $('#' + possibleIds[i]);
                    if (container.length && container.hasClass('ss-searchable-dropdown-field')) {
                        searchableContainer = container;
                        break;
                    }
                }

                if (searchableContainer && searchableContainer.length) {
                    // Look for hidden input inside
                    depends = searchableContainer.find('input[type="hidden"]');

                    if (depends.length) {
                        isReactField = true;
                    } else {
                        // Hidden input doesn't exist yet, wait for React to render it
                        drop._waitForReactField(searchableContainer, fieldName, displayError);
                        return; // Exit early, we'll continue when the field appears
                    }
                }
            }

            // Check if it's a SearchableDropdownField (React field) - for fields found by name
            if (depends.length && !isReactField && depends.attr('type') === 'hidden') {
                var container = depends.closest('.ss-searchable-dropdown-field');
                if (container.length) {
                    isReactField = true;
                }
            }

            if (dependsTreedropdownfield.length) {
                dependsTreedropdownfield.on('change', function (e) {
                    var newValue = dependsTreedropdownfield.val();
                    var selectedValuesArray = drop.val();

                    // if the new value is not set, set it as disabled
                    if (!newValue) {
                        drop.disable(drop.data('unselected'));
                        return;
                    }

                    drop.disable("Loading...");
                    $.get(
                        drop.data('link'),
                        {
                            val: newValue,
                            selectedValues: selectedValuesArray,
                        },
                        function (data) {
                            var dependant = $('.dependent-dropdown');
                            var hasError = typeof data.error !== 'undefined';

                            if (dependant.hasClass('chosen-disabled')) {
                                dependant.removeClass('chosen-disabled');
                            }

                            if (data.length === 0 || hasError) {
                                dependant.addClass('chosen-disabled');
                            }

                            if (hasError) {
                                return displayError(data, dependsTreedropdownfield);
                            }

                            drop.enable();
                            if (drop.data('empty') || drop.data('empty') === "") {
                                drop.append($("<option />").val("").text(drop.data('empty')));
                            }

                            $.each(data, function () {
                                var optGroup = $("<optgroup label=\"" + this.k + "\"></optgroup>");
                                $.each(this.v, function(k, v) {
                                    optGroup.append($("<option value=\"" + k + "\">" + v + "</option>"));
                                });
                                drop.append(optGroup);
                            });
                            drop.trigger("liszt:updated").trigger("chosen:updated").trigger("change");
                        }
                    );
                });

                return;
            }

            // Handle React fields (SearchableDropdownField) with polling
            if (isReactField) {
                drop._setupReactFieldMonitoring(depends, displayError);
            } else {
                // Handle regular fields (DropdownField, etc.)
                depends.change(function () {
                    drop._handleDependsChange(this.value, displayError, depends);
                });
            }

            if (!depends.val()) {
                drop.disable(drop.data('unselected'));
            }
        },

        _waitForReactField: function(container, fieldName, displayError) {
            var drop = this;
            var attempts = 0;
            var maxAttempts = 50; // 5 seconds max (50 * 100ms)

            var checkForInput = function() {
                var hiddenInput = container.find('input[type="hidden"]');
                attempts++;

                if (hiddenInput.length) {
                    // Now set up monitoring
                    drop._setupReactFieldMonitoring(hiddenInput, displayError);

                    // Check initial value
                    if (!hiddenInput.val()) {
                        drop.disable(drop.data('unselected'));
                    }

                    return true;
                }

                if (attempts >= maxAttempts) {
                    return true; // Stop trying
                }

                return false;
            };

            // Try immediately
            if (checkForInput()) {
                return;
            }

            // Use MutationObserver to watch for the input being added
            var observer = new MutationObserver(function(mutations) {
                if (checkForInput()) {
                    observer.disconnect();
                }
            });

            observer.observe(container[0], {
                childList: true,
                subtree: true
            });

            // Also poll as a fallback (in case MutationObserver misses it)
            var pollInterval = setInterval(function() {
                if (checkForInput()) {
                    clearInterval(pollInterval);
                    observer.disconnect();
                }
            }, 100);
        },

        _setupReactFieldMonitoring: function(hiddenInput, displayError) {
            var drop = this;
            var lastValue = hiddenInput.val();

            // Poll for value changes (React doesn't fire change events)
            var checkInterval = setInterval(function() {
                var currentValue = hiddenInput.val();
                if (currentValue !== lastValue) {
                    lastValue = currentValue;
                    drop._handleDependsChange(currentValue, displayError, hiddenInput);
                }
            }, 150);  // Check every 150ms

            // Store interval ID for cleanup
            drop.data('react-monitor-interval', checkInterval);
        },

        _handleDependsChange: function(value, displayError, element) {
            var drop = this;

            if (!value) {
                drop.disable(drop.data('unselected'));
            } else {
                drop.disable("Loading...");

                $.get(drop.data('link'), {
                        val: value
                    },
                    function (data) {
                        var hasError = typeof data.error !== 'undefined';

                        if (hasError) {
                            return displayError(data, element);
                        }

                        drop.enable();

                        if (drop.data('empty') || drop.data('empty') === "") {
                            drop.append($("<option />").val("").text(drop.data('empty')));
                        }

                        $.each(data, function () {
                            var optGroup = $("<optgroup label=\"" + this.k + "\"></optgroup>");
                            $.each(this.v, function(k, v) {
                                optGroup.append(
                                    $("<option value=\"" + k + "\">" + v + "</option>")
                                );
                            });
                            drop.append(optGroup);
                        });
                        drop.trigger("liszt:updated").trigger("chosen:updated").trigger("change");
                    });
            }
        },

        onunmatch: function() {
            // Clean up polling interval
            var interval = this.data('react-monitor-interval');
            if (interval) {
                clearInterval(interval);
            }
            this._super();
        },

        disable: function (text) {
            this.empty().append($("<option />").val("").text(text)).attr("disabled", "disabled").trigger("liszt:updated").trigger("chosen:updated");
        },
        enable: function () {
            this.empty().removeAttr("disabled").next().removeClass('chzn-disabled');
        }
    });

});

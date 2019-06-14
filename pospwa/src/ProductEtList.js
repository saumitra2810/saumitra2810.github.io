import React from "react";
import { updateArr } from "./POSAPI";
import PropTypes from "prop-types";
import {
  Thumbnail,
  Stack,
  Modal,
  Spinner,
  ChoiceList,
  Badge,
  Button,
  ResourceList,
  TextStyle
} from "@shopify/polaris";
const etTxts = {
  3: "Added To Cart",
  4: "Wishlisted",
  8: "Subscribed",
  6: "Previously purchased",
  1: "Viewed"
};
const txtEts = {
  Wishlisted: 4,
  Subscribed: 8,
  "Previously purchased": 6,
  Viewed: 1
};
const baseFilters = [
  {
    label: "Wishlisted",
    value: "et4"
  },
  {
    label: "Viewed",
    value: "et1"
  },
  {
    label: "Purchased",
    value: "et6"
  },
  {
    label: "Added to Cart",
    value: "et3"
  }
];

const filterText = "Filter";
const filterClearText = "Clear";
const spinnerLarge = <Spinner color="teal" />;
export default class ProductEtList extends React.Component {
  static propTypes = {
    name: PropTypes.object,
    etItems: PropTypes.array,
    etSearchValue: PropTypes.string,
    etSortValue: PropTypes.string,
    actions: PropTypes.array,
    loadingMessage: PropTypes.string,
    onSearchFilterSort: PropTypes.func,
    onSelectionChange: PropTypes.func,
    onAction: PropTypes.func,
    onVariantChanged: PropTypes.func
  };
  handleEtSelectionChange = selectedEtItems => {
    let cnt = selectedEtItems.length;
    let allCnt = this.state.etItems.length;
    if (allCnt === cnt) {
      selectedEtItems = this.state.etItems;
    }
    this.setState({ selectedEtItems });
    this.props.onSelectionChange(selectedEtItems);
  };
  handleEtSearchChange = etSearchValue => {
    console.log("etSearchValue", etSearchValue);
    this.setState({ etSearchValue, selectedEtItems: [] });
    this.props.onSearchFilterSort(
      etSearchValue,
      this.state.etSortValue,
      this.state.filtered,
      this.state.selectedEtItems
    );
  };
  handleEtSortChange = etSortValue => {
    this.setState({ etSortValue, selectedEtItems: [] });
    this.props.onSearchFilterSort(
      this.state.etSearchValue,
      etSortValue,
      this.state.filtered,
      this.state.selectedEtItems
    );
  };
  handleFilterModalConfirm = () => {
    this.handleFilterModalClose();
  };
  handleFilterModalClose = () => {
    this.state.filterModal.showing = false;
    this.setState({ filterModal: this.state.filterModal });
  };
  clearFilter = () => {
    let filtered = [false];
    this.setState({ filtered, selectedEtItems: [] });
    this.renderFilter(filtered);
  };
  showFilter = () => {
    this.state.filterModal.showing = true;
    this.setState({ filterModal: this.state.filterModal });
  };
  handleFilterChange = (filtered, filteredText) => {
    this.setState({ filtered, selectedEtItems: [] });
    this.renderFilter(filtered);
  };
  renderFilter(filtered) {
    this.props.onSearchFilterSort(
      this.state.etSearchValue,
      this.state.etSortValue,
      filtered,
      this.state.selectedEtItems
    );
  }
  componentWillReceiveProps(newProps) {
    this.setState({ etItems: newProps.etItems });
  }
  handleEtVariantSelection = item => {
    let { du } = item,
      me = this;
    this.setState({
      variantModal: true,
      variantSelectionItem: item,
      variantsModalLoading: true
    });
    //console.log("handleEtVariantSelection", item);
    window.ShopifyStoreAPI.getProductForDu(du, {
      success: productJson => {
        try {
          let productJsonVariants = [],
            selectedVariant;
          productJson.variants.forEach(v => {
            if (v.id === item.epi) {
              selectedVariant = item;
            }
            productJsonVariants.push({
              label: (
                <div style={{ display: "block" }}>
                  <Stack alignment="center">
                    <Stack.Item>
                      <Thumbnail source={v.iu} size="large" alt={v.title} />
                    </Stack.Item>
                    <Stack.Item>
                      <div>
                        <h3>
                          <TextStyle variation="strong">{v.title}</TextStyle>
                        </h3>
                        <small>
                          {this.state.currency} {v.pr.toFixed(2)}
                        </small>
                      </div>
                    </Stack.Item>
                  </Stack>
                </div>
              ),
              value: v.epi
            });
          });
          me.setState({
            variantsModalLoading: false,
            productJsonVariants: productJsonVariants,
            variantSelected: [selectedVariant.epi]
          });
        } catch (err) {
          alert(err.name + err.message + err.stack);
          window._LTracker.push(err);
        }
      }
    });
  };
  handleEtVariantChange = selectedVariant => {
    this.setState({ variantSelected: selectedVariant });
  };
  handleEtVariantClose = () => {
    this.setState({ variantModal: false });
  };
  handleEtVariantConfirm = () => {
    try {
      let v = window.ShopifyStoreAPI._epis[this.state.variantSelected],
        et = this.state.variantSelectionItem;
      ["epi", "variants", "pr", "iu"].forEach(k => {
        et[k] = v[k];
      });
      let etItems = this.state.etItems,
        selectedEtItems = this.state.selectedEtItems || [];
      [etItems, selectedEtItems].forEach(r => {
        updateArr(r, et);
      });
      this.props.onVariantChanged(et);
      this.setState({
        variantModal: !this.state.variantModal,
        etItems: etItems,
        selectedEtItems: selectedEtItems
      });
      this.props.onSelectionChange(selectedEtItems);
    } catch (err) {
      window._LTracker.push(err);
    }
  };

  createFilters = etItems => {
    let filters = [],
      uniqueHashtags = {};
    etItems.forEach(et => {
      if (et.hashtags)
        et.hashtags.forEach(hashtag => {
          uniqueHashtags[hashtag] = true;
        });
    });
    baseFilters.forEach(f => {
      filters.push(f);
    });
    Object.keys(uniqueHashtags).forEach(hashtag => {
      filters.push({
        label: (
          <Badge status="info" size="small">
            {hashtag}
          </Badge>
        ),
        value: hashtag
      });
    });
    return filters;
  };

  constructor(props) {
    super(props);
    this.state = {
      selectedEtItems: [],
      etItems: this.props.etItems,
      etSearchValue: this.props.etSearchValue,
      etSortValue: this.props.etSortValue,
      filterText: filterText,
      filtered: [false],
      filters: this.createFilters(this.props.etItems),
      filterModal: {
        showing: false
      },
      variantModal: false,
      variantsModalLoading: true,
      variantSelectionItem: null,
      productJsonVariants: [],
      variantSelected: null
    };
  }
  renderEtItem = item => {
    const { epi, dt, iu, variants, pr, et, ts } = item;
    let v;
    //console.log(new Date(ts));
    try {
      const x = JSON.parse(variants);
      v = (x[0] ? Object.keys(x[0])[0] : Object.keys(x)[0]).trim();
    } catch (err) {
      v = variants ? variants.split('":')[0].replace('[{"', "") : "";
    }
    const ettxt = (
      <Badge status="info" size="small">
        {etTxts[et]}
      </Badge>
    );
    const media = <Thumbnail source={iu} size="large" alt={dt} />;
    return (
      <ResourceList.Item id={item} media={media}>
        <Stack>
          <Stack.Item fill>
            <h3>
              <TextStyle variation="strong">{dt}</TextStyle>
            </h3>
            <h5>{v}</h5>
            <div>
              <small>
                {this.state.currency} {pr.toFixed(2)}
              </small>
            </div>
            <Button
              plain
              loading={false}
              onClick={() => this.handleEtVariantSelection(item)}
            >
              Change Variant
            </Button>
          </Stack.Item>
          <Stack.Item>
            <div>{ettxt}</div>
          </Stack.Item>
        </Stack>
      </ResourceList.Item>
    );
  };
  render() {
    const filterControl = (
      <div>
        <Stack alignment="center" center>
          <Stack.Item fill>
            <ResourceList.FilterControl
              searchValue={this.state.etSearchValue}
              onSearchChange={this.handleEtSearchChange}
            />
          </Stack.Item>
          <Stack.Item>
            <div style={{ marginRight: "10px", textAlign: "center" }}>
              <Button plain onClick={this.showFilter}>
                {this.state.filterText}
              </Button>
            </div>
          </Stack.Item>
          {this.state.filtered[0] ? (
            <Stack.Item>
              <div style={{ marginRight: "10px", textAlign: "center" }}>
                <Button plain onClick={this.clearFilter}>
                  {filterClearText}
                </Button>
              </div>
            </Stack.Item>
          ) : (
            ""
          )}
        </Stack>
      </div>
    );
    return (
      <div>
        <ResourceList
          resourceName={this.props.name}
          items={this.state.etItems}
          renderItem={this.renderEtItem}
          selectedItems={this.state.selectedEtItems}
          onSelectionChange={this.handleEtSelectionChange}
          promotedBulkActions={this.props.actions}
          sortValue={this.state.etSortValue}
          sortOptions={[
            { label: "Recent first", value: "TS_DESC" },
            { label: "Oldest first", value: "TS_ASC" },
            { label: "Costlier first", value: "PR_DESC" },
            { label: "Cheaper first", value: "PR_ASC" }
          ]}
          onSortChange={this.handleEtSortChange}
          filterControl={filterControl}
        />
        <div id="filterModal">
          <Modal
            open={this.state.filterModal.showing}
            title="Choose Filter"
            primaryAction={{
              content: "Choose Filter",
              onAction: this.handleFilterModalConfirm
            }}
            secondaryActions={[
              {
                content: "Close",
                onAction: this.handleFilterModalClose
              }
            ]}
          >
            <Modal.Section>
              <ChoiceList
                choices={this.state.filters}
                selected={this.state.filtered}
                onChange={this.handleFilterChange}
              />
            </Modal.Section>
          </Modal>
        </div>
        <Modal
          open={this.state.variantModal}
          onClose={this.handleEtVariantClose}
          title="Choose Variant"
          primaryAction={{
            content: "Confirm Variant",
            onAction: this.handleEtVariantConfirm
          }}
          secondaryActions={[
            {
              content: "Cancel",
              onAction: this.handleEtVariantClose
            }
          ]}
        >
          <Modal.Section>
            {this.state.variantsModalLoading ? (
              <div
                style={{
                  textAlign: "center",
                  height: "200px",
                  padding: "10rem"
                }}
              >
                {spinnerLarge}
              </div>
            ) : (
              <ChoiceList
                title={
                  "Product variants for " + this.state.variantSelectionItem.dt
                }
                choices={this.state.productJsonVariants}
                selected={this.state.variantSelected}
                onChange={this.handleEtVariantChange}
              />
            )}
          </Modal.Section>
        </Modal>
      </div>
    );
  }
}

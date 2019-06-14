import "./App.css";
import { updateArr } from "./POSAPI";
import React from "react";
import {
  Card,
  Stack,
  Modal,
  Spinner,
  Badge,
  Button,
  SkeletonDisplayText,
  ResourceList,
  FilterType,
  Collapsible,
  TextStyle,
  Page,
  Banner,
  TextContainer
} from "@shopify/polaris";
import ProductEtList from "./ProductEtList";
const txtEts = {
  Wishlisted: 4,
  Subscribed: 8,
  "Added To Cart": 3,
  "Previously purchased": 6,
  Viewed: 1
};
const spinnerSmall = <Spinner size="small" color="teal" />;
const spinnerLarge = <Spinner color="teal" />;
export default class ResourceListExample extends React.Component {
  state = {
    showCartActions: true,
    showEtActions: true,
    showEts: true,
    loadingCart: true,
    loadingSwym: true,
    showDraftOrder: false,
    showCartInfo: false,
    selectedEtItems: [],
    selectedCartItems: [],
    loc: null,
    cartInfo: { line_items: [], customer: null },
    actualCart: { line_items: [], customer: null },
    cartEmpis: [],
    etItems: [],
    appliedFilters: [],
    etSearchValue: "",
    currentAction: "",
    currency: "$",
    operationModal: {
      showing: false,
      loading: false,
      primaryAction: "Return to POS Checkout",
      title: "Adding to cart",
      msg: (
        <TextContainer>
          {spinnerSmall}{" "}
          <span style={{ verticalAlign: "top" }}>Adding to cart</span>
        </TextContainer>
      )
    }
  };
  filterFns = {
    et4: a => {
      return a.et === 4;
    },
    et1: a => {
      return a.et === 1;
    },
    et6: a => {
      return a.et === 6;
    },
    et3: a => {
      return a.et === 3;
    },
    hashtagFilter: hashtag => {
      return a => {
        return a.hashtags && a.hashtags.indexOf(hashtag) > -1;
      };
    }
  };
  sortFns = {
    PR_ASC: (a, b) => {
      return b.pr < a.pr ? 1 : -1;
    },
    PR_DESC: (a, b) => {
      return a.pr < b.pr ? 1 : -1;
    },
    TS_DESC: (a, b) => {
      return a.ts < b.ts ? 1 : -1;
    },
    TS_ASC: (a, b) => {
      return b.ts < a.ts ? 1 : -1;
    }
  };
  etModel = {
    sortFn: (etItems, sortValue) => {
      let me = this;
      let sorter = me.sortFns[sortValue];
      let sortedItems = etItems.sort(sorter);
      return sortedItems;
    },
    filterFn: (etItems, filterToApply) => {
      let me = this,
        filteredEtItems = etItems,
        filterFn = me.filterFns[filterToApply];
      if (filterToApply) {
        if (!filterFn) {
          // hashtag filter
          filterFn = me.filterFns.hashtagFilter(filterToApply);
        }
        filteredEtItems = etItems.filter(filterFn);
      }
      return filteredEtItems;
    },
    searchFn: (etItems, searchValue) => {
      let me = this;
      console.log("searchFn", searchValue);
      let filteredEtItems = etItems;
      if (searchValue) {
        let s = new RegExp(searchValue, "gi");
        filteredEtItems = etItems.filter(x => {
          return x.dt.search(s) > -1;
        });
      }
      return filteredEtItems;
    }
  };
  handleEtVariantChange = et => {
    this.actualEtItems = updateArr(this.actualEtItems, et);
  };
  handleEtSelectionChange = selectedEtItems => {
    this.setState({ selectedEtItems });
  };
  handleEtListChange = (
    etSearchValue,
    etSortValue,
    etFilters,
    selectedEtItems
  ) => {
    let me = this;
    let searchResults = me.etModel.searchFn(me.actualEtItems, etSearchValue),
      sortResults = me.etModel.sortFn(searchResults, etSortValue),
      filterResults = me.etModel.filterFn(sortResults, etFilters[0]);
    me.setState({ etItems: filterResults, selectedEtItems: selectedEtItems });
  };
  actualEtItems = [];

  handleOperationModalClose = () => {
    this.state.operationModal.showing = false;
    this.setState(this.state.operationModal);
  };
  handleOperationModalConfirm = () => {
    window.handleClose();
  };
  renderCartAndEts = (etItems, cartInfo) => {
    this.setState({
      cartInfo: cartInfo,
      loadingCart: false,
      loadingSwym: false,
      etItems: etItems
    });
    this.actualEtItems = etItems;
  };
  refreshCartAndEts = (byPass = false) => {
    let me = this;
    this.setState({
      loadingCart: true,
      loadingSwym: true
    });
    if (byPass) {
      window.ShopifyPOSAPI.loadCart({
        success: swymCart => {
          window.SwymAPI.getEventsForUser({
            success: etItems => {
              me.renderCartAndEts(etItems, window.CFG.POSCart);
              me.setState({ currency: window.CFG.currency });
            }
          });
        }
      });
    } else {
      window.SwymAPI.getEventsForUser({
        success: etItems => {
          me.renderCartAndEts(etItems, window.CFG.POSCart);
        }
      });
    }
  };
  componentDidMount() {
    let me = this;
    document.addEventListener("swym:ready", evt => {
      me.setState({
        showCartActions: window.CFG.showCartActions,
        showCartInfo: window.CFG.showCartInfo,
        showEtActions: window.CFG.showEtActions,
        showEts: window.CFG.showEts,
        showDraftOrder: window.CFG.showDraftOrder
      });
      me.refreshCartAndEts(window.CFG.isPOS);
    });

    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      me.deferredPrompt = e;
    });
  }
  toggleCart = () => {
    this.setState({
      showCartInfo: !this.state.showCartInfo,
      currentAction: !this.state.showCartInfo
        ? "Move Products from Cart"
        : "Add Products to Cart"
    });
  };
  handleCartSelectionChange = selectedCartItems => {
    let cnt = selectedCartItems.length;
    let allCnt = this.state.cartInfo.line_items.length;
    if (allCnt === cnt) {
      selectedCartItems = this.state.cartInfo.line_items;
    }
    this.setState({ selectedCartItems });
  };
  handleEtAddToCart = evt => {
    let selectedEtItems = this.state.selectedEtItems,
      cnt = selectedEtItems.length,
      ocnt = 0,
      me = this;

    let operationModal = {
      showing: true,
      loading: true,
      title: "Adding to cart",
      msg: (
        <TextContainer>
          {spinnerSmall}{" "}
          <span style={{ verticalAlign: "top" }}>
            Adding {cnt} items to cart
          </span>
        </TextContainer>
      )
    };
    window._LTracker.push({
      ac: "starting",
      op: "carting",
      cnt: cnt,
      ocnt: ocnt,
      showing: operationModal.showing,
      loading: operationModal.loading
    });
    this.setState({ loadingCart: true, operationModal: operationModal });
    selectedEtItems.forEach(etItem => {
      let epi = etItem.epi;
      window.ShopifyPOSAPI.addLineItemToCart(epi, {
        success: () => {
          ocnt++;
          operationModal.msg = (
            <TextContainer>
              {spinnerSmall}{" "}
              <span style={{ verticalAlign: "top" }}>
                Adding {ocnt}/{cnt} items to cart
              </span>
            </TextContainer>
          );
          window._LTracker.push({
            ac: "doing",
            op: "carting",
            cnt: cnt,
            ocnt: ocnt,
            showing: operationModal.showing,
            loading: operationModal.loading
          });
          me.setState({ operationModal: operationModal });
          if (cnt === ocnt) {
            operationModal.loading = false;
            operationModal.title = "Operation successful!";
            operationModal.msg = (
              <TextContainer>
                <Banner status="success">
                  <p>Added {ocnt} items to cart</p>
                </Banner>
              </TextContainer>
            );
            window._LTracker.push({
              ac: "done",
              op: "carting",
              cnt: cnt,
              ocnt: ocnt,
              showing: operationModal.showing,
              loading: operationModal.loading
            });
            me.refreshCartAndEts();
            this.setState({
              loadingCart: false,
              cartInfo: window.CFG.POSCart,
              selectedEtItems: [],
              operationModal: operationModal
            });
          }
        }
      });
    });
  };

  handleEtDraftOrder = evt => {
    let selectedEtItems = this.state.selectedEtItems,
      cnt = selectedEtItems.length,
      ocnt = 0,
      me = this;

    let operationModal = {
      showing: true,
      loading: true,
      primaryAction: "Go to Draft order",
      title: "Creating draft order",
      msg: (
        <TextContainer>
          {spinnerSmall}{" "}
          <span style={{ verticalAlign: "top" }}>
            Adding {cnt} items to draft order
          </span>
        </TextContainer>
      )
    };
    window._LTracker.push({
      ac: "starting",
      op: "draftorder",
      cnt: cnt,
      showing: operationModal.showing,
      loading: operationModal.loading
    });
    this.setState({ loadingCart: true, operationModal: operationModal });
    var epis = [];
    selectedEtItems.forEach(etItem => {
      epis.push(etItem.epi);
    });
    window.ShopifyPOSAPI.createDraftOrder(epis, {
      success: draftOrder => {
        operationModal.loading = false;
        operationModal.title = "Operation successful!";
        operationModal.msg = (
          <TextContainer>
            <Banner status="success">
              <p>Added {ocnt} items to draft order</p>
            </Banner>
          </TextContainer>
        );
        window._LTracker.push({
          ac: "done",
          op: "draftorder",
          cnt: cnt,
          showing: operationModal.showing,
          loading: operationModal.loading
        });
        this.setState({
          loadingCart: false,
          cartInfo: window.CFG.POSCart,
          selectedEtItems: [],
          operationModal: operationModal
        });
        window.handleDraftOrderCreation(draftOrder.draft_order.id);
      }
    });
  };

  handleCartToEngage = (acType = "wishlist", removeFromCart = false) => {
    try {
      let selectedCartItems = this.state.selectedCartItems,
        cnt = selectedCartItems.length,
        ocnt = 0,
        me = this;

      let operationModal = {
        showing: true,
        loading: true,
        title: "Adding to " + acType,
        msg: (
          <TextContainer>
            {spinnerSmall}{" "}
            <span style={{ verticalAlign: "top" }}>
              Adding {cnt} items to {acType}
            </span>
          </TextContainer>
        )
      };
      window._LTracker.push({
        ac: "starting",
        op: acType,
        cnt: cnt,
        ocnt: ocnt,
        showing: operationModal.showing,
        loading: operationModal.loading
      });
      this.setState({ loadingCart: true, operationModal: operationModal });
      selectedCartItems.forEach(cartItem => {
        let epi = cartItem.variant_id;
        (acType === "wishlist"
          ? window.SwymAPI.addProductToWishlist
          : window.SwymAPI.addProductToISA)(epi, {
          success: () => {
            if (removeFromCart) {
              let idx = window.CFG.POSCart.epiToIdx[epi];
              window._LTracker.push({
                op: "removingFromCart",
                epi: epi,
                idx: idx
              });
              window.ShopifyPOSAPI.removeLineItemFromCart(idx, {
                success: () => {
                  window._LTracker.push({
                    op: "removedFromCart",
                    epi: epi,
                    idx: idx
                  });
                }
              });
            }
            ocnt++;
            operationModal.msg = (
              <TextContainer>
                {spinnerSmall}{" "}
                <span style={{ verticalAlign: "top" }}>
                  Adding {ocnt}/{cnt} items to {acType}
                </span>
              </TextContainer>
            );
            window._LTracker.push({
              ac: "doing",
              op: acType,
              cnt: cnt,
              ocnt: ocnt,
              showing: operationModal.showing,
              loading: operationModal.loading
            });
            me.setState({ operationModal: operationModal });
            if (cnt === ocnt) {
              operationModal.loading = false;
              operationModal.title = "Operation successful!";
              operationModal.msg = (
                <TextContainer>
                  <Banner status="success">
                    <p>
                      Added {cnt} items to {acType}
                    </p>
                  </Banner>
                </TextContainer>
              );
              window._LTracker.push({
                ac: "done",
                op: acType,
                cnt: cnt,
                ocnt: ocnt,
                showing: operationModal.showing,
                loading: operationModal.loading
              });
              me.refreshCartAndEts();
              this.setState({
                loadingCart: false,
                cartInfo: window.CFG.POSCart,
                selectedCartItems: [],
                operationModal: operationModal
              });
            }
          }
        });
      });
    } catch (err) {
      window._LTracker.push(err);
    }
  };
  renderCartItem = item => {
    const {
      variant_id,
      product_id,
      title,
      variant_title,
      variants,
      price,
      quantity
    } = item;
    return (
      <ResourceList.Item
        id={item}
        //media={media}
      >
        <Stack>
          <Stack.Item fill>
            <h3>
              <TextStyle variation="strong">{title}</TextStyle>
            </h3>
            <TextStyle variation="subdued">
              <small>{variant_title}</small>
            </TextStyle>
          </Stack.Item>
          <Stack.Item>
            <TextStyle variation="subdued">
              <div>
                <small>
                  {this.state.currency} {price.toFixed(2)}
                </small>
              </div>
            </TextStyle>
          </Stack.Item>
          <Stack.Item>
            <Badge size="small">{quantity}</Badge>
          </Stack.Item>
        </Stack>
      </ResourceList.Item>
    );
  };

  showInstallPrompt = (e) => {
    e.preventDefault();
    e.target.style.display = "none";
    let me = this;
    // Show the prompt
    this.deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    this.deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the A2HS prompt');
      } else {
      console.log('User dismissed the A2HS prompt');
      }
      me.deferredPrompt = null;
    });
  };

  render() {
    const etResourceName = {
      singular: "product",
      plural: "products"
    };
    const cartResourceName = {
      singular: "cart item",
      plural: "cart items"
    };
    const promotedEtBulkActions = this.state.showDraftOrder
      ? [
          {
            content: "Create Draft order",
            onAction: this.handleEtDraftOrder
          }
        ]
      : [
          {
            content: "Add to cart",
            onAction: this.handleEtAddToCart
          }
        ];
    const promotedCartBulkActions = [
      {
        content: "Add to wishlist",
        onAction: () => {
          this.handleCartToEngage("wishlist", true);
        }
      }
    ];
    const bulkCartActions = [
      {
        content: "Subscribe",
        onAction: () => {
          this.handleCartToEngage("subscribe", true);
        }
      },
      {
        content: "Move to Wishlist",
        onAction: () => console.log("Todo: implement bulk move to wishlist")
      }
    ];
    const filters = [
      {
        key: "etFilter",
        label: "Product",
        operatorText: "was",
        type: FilterType.Select,
        options: Object.keys(txtEts)
      }
    ];
    return (
      <Page style={{ maxHeight: "100%" }}>
        <div
          className="topBar"
          style={{
            marginBottom: "65px",
            height: "calc(100% - 65px)",
            overflowY: "scroll"
          }}
        >
          <Card
            title={this.state.currentAction}
            actions={
              this.state.showCartActions && !this.state.loadingSwym
                ? [
                    {
                      content:
                        (this.state.showCartInfo ? "Hide" : "Show") +
                        " Cart " +
                        (this.state.loadingCart
                          ? ""
                          : "(" + this.state.cartInfo.line_items.length + ")"),
                      onAction: this.toggleCart
                    }
                  ]
                : []
            }
          >
            <Collapsible open={this.state.showCartInfo} id="basic-collapsible">
              <Card.Section>
                {!this.state.loadingCart ? (
                  <div>
                    <p>
                      Customer email :{" "}
                      {!this.state.loadingCart ? (
                        <TextStyle variation="strong">
                          {this.state.cartInfo.customer.email}
                        </TextStyle>
                      ) : (
                        <SkeletonDisplayText size="small" />
                      )}
                    </p>
                    <ResourceList
                      id="cart-rlist"
                      resourceName={cartResourceName}
                      items={this.state.cartInfo.line_items}
                      renderItem={this.renderCartItem}
                      selectedItems={this.state.selectedCartItems}
                      onSelectionChange={this.handleCartSelectionChange}
                      promotedBulkActions={promotedCartBulkActions}
                      bulkActions={
                        this.state.showCartActions ? bulkCartActions : []
                      }
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      textAlign: "center",
                      height: "200px",
                      padding: "10rem"
                    }}
                  >
                    {spinnerLarge}
                  </div>
                )}
              </Card.Section>
            </Collapsible>
            {!this.state.loadingSwym ? (
              !this.state.showCartInfo ? (
                <div>
                  <Card.Section>
                    Customer email :{" "}
                    <TextStyle variation="strong">
                      {this.state.cartInfo.customer.email ||
                        window.CFG.customerEmail}
                    </TextStyle>
                  </Card.Section>
                  <ProductEtList
                    name={etResourceName}
                    etItems={this.state.etItems}
                    etSortValue="TS_DESC"
                    onSearchFilterSort={this.handleEtListChange}
                    onSelectionChange={this.handleEtSelectionChange}
                    actions={promotedEtBulkActions}
                    onVariantChanged={this.handleEtVariantChange}
                  />
                </div>
              ) : (
                ""
              )
            ) : (
              <div
                style={{
                  textAlign: "center",
                  height: "200px",
                  padding: "10rem"
                }}
              >
                {spinnerLarge}
              </div>
            )}
          </Card>
        </div>
        <div
          className="bottomFooter"
          style={{
            background: "white",
            position: "fixed",
            bottom: "0px",
            width: "100%",
            left: "0%",
            textAlign: "center",
            zIndex: 1
          }}
        >
          <a href="#" className="install-btn" onClick={this.showInstallPrompt}>Add to home screen</a>
          {!this.state.showCartInfo ? (
            <Button
              style={{ maxWidth: "250px" }}
              fullWidth
              loading={this.state.loadingSwym}
              primary={true}
              size="large"
              onClick={
                this.state.showDraftOrder
                  ? this.handleEtDraftOrder
                  : this.handleEtAddToCart
              }
              disabled={this.state.selectedEtItems.length == 0}
            >
              Add {this.state.selectedEtItems.length} products to{" "}
              {this.state.showDraftOrder ? "Draft order" : "cart"}
            </Button>
          ) : (
            <Button
              style={{ maxWidth: "250px" }}
              fullWidth
              showHidden
              loading={this.state.loadingSwym}
              primary={true}
              size="large"
              onClick={() => {
                this.handleCartToEngage("wishlist", true);
              }}
              disabled={this.state.selectedCartItems.length == 0}
            >
              Move {this.state.selectedCartItems.length} products to Wishlist
            </Button>
          )}
        </div>
        <div id="opModal">
          <Modal
            open={this.state.operationModal.showing}
            title={this.state.operationModal.title}
            primaryAction={{
              content: this.state.operationModal.primaryAction,
              onAction: this.handleOperationModalConfirm,
              disabled: this.state.operationModal.loading
            }}
            secondaryActions={[
              {
                content: "More changes",
                onAction: this.handleOperationModalClose,
                disabled: this.state.operationModal.loading
              }
            ]}
          >
            <Modal.Section>{this.state.operationModal.msg}</Modal.Section>
          </Modal>
        </div>
      </Page>
    );
  }
}

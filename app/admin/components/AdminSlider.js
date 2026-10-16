"use client";
import { useState, useEffect } from 'react'


export default function AdminSlider() {
   
  return (
    <div className=" z-[99] duration-300 print:hidden">
    <div className="flex w-[60px] bg-iconbar dark:bg-slate-800 py-4 items-center fixed top-0 z-[99]
      rounded-[100px] m-4 flex-col h-[calc(100%-30px)]">
      <a href="index.html" className="block text-center logo">
        <span>
          <img src="/uploads/sathyalogo.webp" alt="logo-small" className="logo-sm h-8" />
        </span>
      </a>

      <div className="icon-body max-h-full w-full overflow-hidden">
        <div className="relative h-full">
          <ul className="flex-col w-[60px] items-center mt-[60px] flex-1 border-b-0 tab-menu"
            id="tab-menu" data-tabs-toggle="#Icon-menu">
            <li className="my-0 flex justify-center menu-items" role="presentation">
            <button  
  id="Dashboards-tab"
  data-tabs-target="#Dashboards"
  type="button"
  role="tab"
  aria-controls="Dashboards"
  
>
  <i className="ti ti-smart-home text-3xl"></i>
</button>

            </li>
            <li className="my-0 flex justify-center menu-items" role="presentation">
              <button id="Apps-tab"
                data-tabs-target="#Apps" type="button" role="tab"
                aria-controls="Apps" >
                <i className="ti ti-apps text-3xl"></i>
              </button>
            </li>
            <li className="my-0 flex justify-center menu-items" role="presentation">
              <button  id="Uikit-tab"
                data-tabs-target="#Uikit" type="button" role="tab"
                aria-controls="Uikit" >
                <i className="ti ti-planet text-3xl"></i>
              </button>
            </li>
            <li className="my-0 flex justify-center menu-items" role="presentation">
              <button  id="Pages-tab"
                data-tabs-target="#Pages" type="button" role="tab"
                aria-controls="Pages" >
                <i className="ti ti-files text-3xl"></i>
              </button>
            </li>
            <li className="my-0 flex justify-center menu-items" role="presentation">
              <button  id="Authentication-tab"
                data-tabs-target="#Authentication" type="button" role="tab"
                aria-controls="Authentication" >
                <i className="ti ti-shield-lock text-3xl"></i>
              </button>
            </li>
          </ul>
        </div>
      </div>
      <div className="flex flex-col items-center mt-auto bg-iconbar dark:bg-slate-800 shrink-0">
        <a href="">
          <img src="../assets/images/users/avatar-3.jpg" alt="" className="rounded-full w-8 h-8" />
        </a>
      </div>
    </div>
    <div className="main-menu-inner h-full w-[200px] my-4  fixed top-0 z-[99] left-[calc(60px+16px)] rtl:right-[calc(60px+16px)] rtl:left-0 rounded-lg transition delay-150 duration-300 ease-in-out">
      <div className="main-menu-inner-logo">
        <div className="flex items-center">
          <a href="index.html" className="leading-[60px]">
            <img src="/uploads/sathyalogo.webp" alt="" className="inline-block dark:hidden h-[15px] ltr:ml-4 rtl:ml-0 rtl:mr-4" />
            <img src="/uploads/sathyalogo.webp" alt="" className=" dark:inline-block h-[15px] ltr:ml-4 rtl:ml-0 rtl:mr-4" />
          </a>
          <div className="ltr:mr-2 ltr:lg:mr-4 rtl:mr-0 rtl:ml-2 rtl:lg:mr-0 rtl:lg:ml-4 ml-auto block xl:hidden">
            <button id="toggle-menu-hide-2" className="button-menu-mobile-2 flex rounded-full md:mr-0 relative">
              <i className="ti ti-chevrons-left top-icon text-3xl"></i>
            </button>
          </div>
        </div>
        <div className="menu-body h-[calc(100vh-60px)] p-4" >
          <div id="Icon-menu">
            <div className="" id="Dashboards" role="tabpanel" aria-labelledby="Dashboards-tab">
              <div className="title-box mb-3">
                <h6 className="text-sm font-medium uppercase text-slate-400">Dashboards</h6>
              </div>
              <ul className="nav flex-col flex flex-wrap pl-0 mb-0">
                <li className="nav-item relative block">
                  <a href="index.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                    Analytics
                  </a>
                </li>
                <li className="nav-item relative block">
                  <a href="crypto-index.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                    Crypto
                  </a>
                </li>
                <li className="nav-item relative block">
                  <a href="crm-index.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                    CRM
                  </a>
                </li>
                <li className="nav-item relative block">
                  <a href="project-index.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                    Project
                  </a>
                </li>
                <li className="nav-item relative block">
                  <a href="ecommerce-index.html" className="nav-link hover:bg-gray-50 hover:text-primary-500  dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                    Ecommerce
                  </a>
                </li>
                <li className="nav-item relative block">
                  <a href="helpdesk-index.html" className="nav-link hover:bg-gray-50 hover:text-primary-500  dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                    Helpdesk
                  </a>
                </li>
              </ul>
            </div>
            <div className="hidden" id="Apps" role="tabpanel" aria-labelledby="Apps-tab">
              <div className="title-box mb-3">
                <h6 className="text-sm font-medium uppercase text-slate-400">Applications</h6>
              </div>
              <ul className="nav flex-col flex flex-wrap pl-0 mb-0">
                <li>
                  <div id="accordion-flush" data-accordion="collapse"  data-inactive- className="text-gray-700 hover:text-primary-500 dark:text-gray-400">
            
                    <div id="Apps-Analytics">
                      <a href="#" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4 cursor-pointer  " data-accordion-target="#Analytics-flush" aria-expanded="false" aria-controls="Analytics-flush">
                        <span>Analytics</span>
                        <i className="fas fa-angle-down ml-auto inline-block text-sm transform transition-transform duration-300" data-accordion-icon></i>
                      </a>
                    </div>
                    <div id="Analytics-flush" className="collapse-menu hidden" aria-labelledby="Apps-Analytics">
                      <ul className="nav flex-col flex flex-wrap pl-0 mb-0">
                
                        <li className="nav-item relative block">
                          <a href="analytics-customers.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Customers
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="analytics-reports.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Reports
                          </a>
                        </li>
                      </ul>
                    </div>

                    <div id="Apps-Crypto">
                      <a href="#" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4 cursor-pointer  " data-accordion-target="#Crypto-flush" aria-expanded="false" aria-controls="Crypto-flush">
                        <span>Crypto</span>
                        <i className="fas fa-angle-down ml-auto inline-block text-sm transform transition-transform duration-300" data-accordion-icon></i>
                      </a>
                    </div>
                    <div id="Crypto-flush" className="collapse-menu hidden" aria-labelledby="Apps-Crypto">
                      <ul className="nav flex-col flex flex-wrap pl-0 mb-0">                      
                        <li className="nav-item relative block">
                          <a href="crypto-exchange.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Exchange
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="crypto-wallet.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Wallet
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="crypto-news.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Crypto News
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="crypto-ico.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            ICO List
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="crypto-settings.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Settings
                          </a>
                        </li>
                      </ul>
                    </div>

                    <div id="Apps-CRM">
                      <a href="#" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4 cursor-pointer  " data-accordion-target="#CRM-flush" aria-expanded="false" aria-controls="CRM-flush">
                        <span>CRM</span>
                        <i className="fas fa-angle-down ml-auto inline-block text-sm transform transition-transform duration-300" data-accordion-icon></i>
                      </a>
                    </div>
                    <div id="CRM-flush" className="collapse-menu hidden" aria-labelledby="Apps-CRM">
                      <ul className="nav flex-col flex flex-wrap pl-0 mb-0">                      
                        <li className="nav-item relative block">
                          <a href="crm-contacts.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Contacts
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="crm-opportunities.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Opportunities
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="crm-leads.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Leads
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="crm-customers.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Customers
                          </a>
                        </li>
                      </ul>
                    </div>

                    <div id="Apps-Projects">
                      <a href="#" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4 cursor-pointer  " data-accordion-target="#Projects-flush" aria-expanded="false" aria-controls="Projects-flush">
                        <span>Projects</span>
                        <i className="fas fa-angle-down ml-auto inline-block text-sm transform transition-transform duration-300" data-accordion-icon></i>
                      </a>
                    </div>
                    <div id="Projects-flush" className="collapse-menu hidden" aria-labelledby="Apps-Projects">
                      <ul className="nav flex-col flex flex-wrap pl-0 mb-0">                      
                        <li className="nav-item relative block">
                          <a href="projects-clients.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Clients
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="projects-team.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Team
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="projects-project.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Projects
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="projects-task.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Tasks
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="projects-kanban-board.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Kanban Board
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="projects-chat.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Chat
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="projects-users.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Users
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="projects-create.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Project Create
                          </a>
                        </li>
                      </ul>
                    </div>

                    <div id="Apps-Ecommerce">
                      <a href="#" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4 cursor-pointer  " data-accordion-target="#Ecommerce-flush" aria-expanded="false" aria-controls="Ecommerce-flush">
                        <span>Ecommerce</span>
                        <i className="fas fa-angle-down ml-auto inline-block text-sm transform transition-transform duration-300" data-accordion-icon></i>
                      </a>
                    </div>
                    <div id="Ecommerce-flush" className="collapse-menu hidden" aria-labelledby="Apps-Ecommerce">
                      <ul className="nav flex-col flex flex-wrap pl-0 mb-0">                      
                        <li className="nav-item relative block">
                          <a href="ecommerce-products.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Products
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="ecommerce-product-list.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Product List
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="ecommerce-product-detail.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Product Detail
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="ecommerce-cart.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Cart
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="ecommerce-checkout.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Chackout
                          </a>
                        </li>                     
                      </ul>
                    </div>

                    <div id="Apps-Helpdesk">
                      <a href="#" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4 cursor-pointer " data-accordion-target="#Helpdesk-flush" aria-expanded="false" aria-controls="Helpdesk-flush">
                        <span>Helpdesk</span>
                        <i className="fas fa-angle-down ml-auto inline-block text-sm transform transition-transform duration-300" data-accordion-icon></i>
                      </a>
                    </div>
                    <div id="Helpdesk-flush" className="collapse-menu hidden" aria-labelledby="Apps-Helpdesk">
                      <ul className="nav flex-col flex flex-wrap pl-0 mb-0">                      
                        <li className="nav-item relative block">
                          <a href="helpdesk-tickets.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Tickets
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="helpdesk-reports.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Reports
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="helpdesk-agents.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Agents
                          </a>
                        </li>                                       
                      </ul>
                    </div>
            

                    <div id="Apps-Email">
                      <a href="#" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4 cursor-pointer  " data-accordion-target="#Email-flush" aria-expanded="false" aria-controls="Email-flush">
                        <span>Email</span>
                        <i className="fas fa-angle-down ml-auto inline-block text-sm transform transition-transform duration-300" data-accordion-icon></i>
                      </a>
                    </div>
                    <div id="Email-flush" className="collapse-menu hidden" aria-labelledby="Apps-Email">
                      <ul className="nav flex-col flex flex-wrap pl-0 mb-0">                      
                        <li className="nav-item relative block">
                          <a href="apps-email-inbox.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Inbox
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="apps-email-read.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Read Email
                          </a>
                        </li>                                    
                      </ul>
                    </div>
                  </div>
                </li> 

                <li className="nav-item relative block">
                  <a href="apps-chat.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                    Chat
                  </a>
                </li>
                <li className="nav-item relative block">
                  <a href="apps-contact-list.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                    Contact List
                  </a>
                </li>
                <li className="nav-item relative block">
                  <a href="apps-calendar.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                    Calendar
                  </a>
                </li>
                <li className="nav-item relative block">
                  <a href="apps-invoice.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                    Invoice
                  </a>
                </li>
              </ul>
            </div>
            <div className="hidden" id="Uikit" role="tabpanel" aria-labelledby="Uikit-tab">
              <div className="title-box mb-3">
                <h6 className="text-sm font-medium uppercase text-slate-400">UI Kit</h6>
              </div>
              <ul className="nav flex-col flex flex-wrap pl-0 mb-0">
                <li className="nav-item relative block">
                  <div id="UI-flush" data-accordion="collapse"  data-inactive className="text-gray-700 hover:text-primary-500 dark:text-gray-400">
            
                    <div id="UIKit-Elements">
                      <a href="#" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4 cursor-pointer  " data-accordion-target="#UI-Elements" aria-expanded="false" aria-controls="UI-Elements">
                        <span>UI Elements</span>
                        <i className="fas fa-angle-down ml-auto inline-block text-sm transform transition-transform duration-300" data-accordion-icon></i>
                      </a>
                    </div>
                    <div id="UI-Elements" className="collapse-menu hidden" aria-labelledby="UIKit-Elements">
                      <ul className="nav flex-col flex flex-wrap pl-0 mb-0">                      
                        <li className="nav-item relative block">
                          <a href="ui-alerts.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Alerts
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="ui-avatar.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Avatar
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="ui-buttons.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Buttons
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="ui-badges.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Badges
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="ui-cards.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Crads
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="ui-carousels.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Carousels
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="ui-dropdowns.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Dropdowns
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="ui-grids.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Grids
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="ui-images.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Images
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="ui-lists.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Lists
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="ui-modals.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Modals
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="ui-navs.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Navs
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="ui-navbar.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Navbar
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="ui-paginations.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Paginations
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="ui-popover-tooltips.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Popover & Tooltips
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="ui-progress.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Progress
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="ui-spinners.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Spinners
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="ui-tabs-accordions.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Tabs & Accordions
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="ui-typography.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Typography
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="ui-videos.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Videos
                          </a>
                        </li>
                      </ul>
                    </div>

                    <div id="UIKit-Advanced">
                      <a href="#" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4 cursor-pointer  " data-accordion-target="#AdvancedUI-flush" aria-expanded="false" aria-controls="AdvancedUI-flush">
                        <span>Advanced UI</span>
                        <i className="fas fa-angle-down ml-auto inline-block text-sm transform transition-transform duration-300" data-accordion-icon></i>
                      </a>
                    </div>
                    <div id="AdvancedUI-flush" className="collapse-menu hidden" aria-labelledby="UIKit-Advanced">
                      <ul className="nav flex-col flex flex-wrap pl-0 mb-0">                      
                        <li className="nav-item relative block">
                          <a href="advanced-animation.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Animation
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="advanced-clipboard.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Clip Board
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="advanced-dragula.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Dragula
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="advanced-files.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            File Manager
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="advanced-highlight.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Highlight
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="advanced-rangeslider.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Range Slider
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="advanced-ratings.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Ratings
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="advanced-ribbons.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Ribbons
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="advanced-sweetalerts.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Sweet Alerts
                          </a>
                        </li>
                      </ul>
                    </div>

                    <div id="UIKit-Forms">
                      <a href="#" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4 cursor-pointer  " data-accordion-target="#Forms-flush" aria-expanded="false" aria-controls="Forms-flush">
                        <span>Forms</span>
                        <i className="fas fa-angle-down ml-auto inline-block text-sm transform transition-transform duration-300" data-accordion-icon></i>
                      </a>
                    </div>
                    <div id="Forms-flush" className="collapse-menu hidden" aria-labelledby="UIKit-Forms">
                      <ul className="nav flex-col flex flex-wrap pl-0 mb-0">                      
                        <li className="nav-item relative block">
                          <a href="forms-elements.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Basic Elements
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="forms-advance.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Advance Elements
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="forms-validation.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Validation
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="forms-wizard.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Wizard
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="forms-editors.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Editors
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="forms-uploads.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            File Upload
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="forms-img-crop.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Image Crop
                          </a>
                        </li>
                      </ul>
                    </div>

                    <div id="UIKit-Charts">
                      <a href="#" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4 cursor-pointer  " data-accordion-target="#Charts-flush" aria-expanded="false" aria-controls="Charts-flush">
                        <span>Charts</span>
                        <i className="fas fa-angle-down ml-auto inline-block text-sm transform transition-transform duration-300" data-accordion-icon></i>
                      </a>
                    </div>
                    <div id="Charts-flush" className="collapse-menu hidden" aria-labelledby="UIKit-Charts">
                      <ul className="nav flex-col flex flex-wrap pl-0 mb-0">                      
                        <li className="nav-item relative block">
                          <a href="charts-apex.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Apex
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="charts-echarts.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Echarts
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="charts-justgage.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            JustGage
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="charts-chartjs.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Chartjs
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="charts-toast-ui.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Toast
                          </a>
                        </li>                      
                      </ul>
                    </div>

                    <div id="UIKit-Tables">
                      <a href="#" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4 cursor-pointer  " data-accordion-target="#Tables-flush" aria-expanded="false" aria-controls="Tables-flush">
                        <span>Tables</span>
                        <i className="fas fa-angle-down ml-auto inline-block text-sm transform transition-transform duration-300" data-accordion-icon></i>
                      </a>
                    </div>
                    <div id="Tables-flush" className="collapse-menu hidden" aria-labelledby="UIKit-Tables">
                      <ul className="nav flex-col flex flex-wrap pl-0 mb-0">                      
                        <li className="nav-item relative block">
                          <a href="tables-basic.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Basic
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="tables-datatable.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Datatables
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="tables-editable.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Editable
                          </a>
                        </li>                                       
                      </ul>
                    </div>

                    <div id="UIKit-Icons">
                      <a href="#" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4 cursor-pointer " data-accordion-target="#Icons-flush" aria-expanded="false" aria-controls="Icons-flush">
                        <span>Icons</span>
                        <i className="fas fa-angle-down ml-auto inline-block text-sm transform transition-transform duration-300" data-accordion-icon></i>
                      </a>
                    </div>
                    <div id="Icons-flush" className="collapse-menu hidden" aria-labelledby="UIKit-Icons">
                      <ul className="nav flex-col flex flex-wrap pl-0 mb-0">                      
                        <li className="nav-item relative block">
                          <a href="icons-materialdesign.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Material Design
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="icons-fontawesome.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Fontawesome
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="icons-tabler.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Tabler
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="icons-feather.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Feather
                          </a>
                        </li>                                       
                      </ul>
                    </div>
                    <div id="UIKit-Maps">
                      <a href="#" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500  font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4 cursor-pointer  " data-accordion-target="#Maps-flush" aria-expanded="false" aria-controls="Maps-flush">
                        <span>Maps</span>
                        <i className="fas fa-angle-down ml-auto inline-block text-sm transform transition-transform duration-300" data-accordion-icon></i>
                      </a>
                    </div>
                    <div id="Maps-flush" className="collapse-menu hidden" aria-labelledby="UIKit-Maps">
                      <ul className="nav flex-col flex flex-wrap pl-0 mb-0">                      
                        <li className="nav-item relative block">
                          <a href="maps-google.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Google Maps
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="maps-leaflet.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Leaflet Maps
                          </a>
                        </li> 
                        <li className="nav-item relative block">
                          <a href="maps-vector.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Vector Maps
                          </a>
                        </li>                   
                      </ul>
                    </div>

                    <div id="UIKit-Email-Templates">
                      <a href="#" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4 cursor-pointer  " data-accordion-target="#Email-Templates-flush" aria-expanded="false" aria-controls="Email-Templates-flush">
                        <span>Email Templates</span>
                        <i className="fas fa-angle-down ml-auto inline-block text-sm transform transition-transform duration-300" data-accordion-icon></i>
                      </a>
                    </div>
                    <div id="Email-Templates-flush" className="collapse-menu hidden" aria-labelledby="UIKit-Email-Templates">
                      <ul className="nav flex-col flex flex-wrap pl-0 mb-0">                      
                        <li className="nav-item relative block">
                          <a href="email-templates-basic.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Basic Action Email
                          </a>
                        </li>
                        <li className="nav-item relative block">
                          <a href="email-templates-alert.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Alert Email
                          </a>
                        </li> 
                        <li className="nav-item relative block">
                          <a href="email-templates-billing.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                            Billing Email
                          </a>
                        </li>                                    
                      </ul>
                    </div>
                  </div>
                </li>              
              </ul>
            </div>
            <div className="hidden" id="Pages" role="tabpanel" aria-labelledby="Pages-tab">
              <div className="title-box mb-3">
                <h6 className="text-sm font-medium uppercase text-slate-400">Pages</h6>
              </div>
              <ul className="nav flex-col flex flex-wrap pl-0 mb-0">
                <li className="nav-item relative block">
                  <a href="pages-profile.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                    Profile
                  </a>
                </li>
                <li className="nav-item relative block">
                  <a href="pages-tour.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                    Tour
                  </a>
                </li>
                <li className="nav-item relative block">
                  <a href="pages-timeline.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                    Timeline
                  </a>
                </li>
                <li className="nav-item relative block">
                  <a href="pages-treeview.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                    Treeview
                  </a>
                </li>
                <li className="nav-item relative block">
                  <a href="pages-starter.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                    Starter Page
                  </a>
                </li>
                <li className="nav-item relative block">
                  <a href="pages-pricing.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                    Pricing
                  </a>
                </li>
                <li className="nav-item relative block">
                  <a href="pages-blogs.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                    Blogs
                  </a>
                </li>
                <li className="nav-item relative block">
                  <a href="pages-faq.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                    FAQs
                  </a>
                </li>
                <li className="nav-item relative block">
                  <a href="pages-gallery.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                    Gallery
                  </a>
                </li>
              </ul>
            </div>
            <div className="hidden" id="Authentication" role="tabpanel" aria-labelledby="Authentication-tab">
              <div className="title-box mb-3">
                <h6 className="text-sm font-medium uppercase text-slate-400">Authentication</h6>
              </div>
              <ul className="nav flex-col flex flex-wrap pl-0 mb-0">
                <li className="nav-item relative block">
                  <a href="auth-login.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                    Login
                  </a>
                </li>
                <li className="nav-item relative block">
                  <a href="auth-login-alt.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                    Login-alt
                  </a>
                </li>
                <li className="nav-item relative block">
                  <a href="auth-register.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                    Register
                  </a>
                </li>
                <li className="nav-item relative block">
                  <a href="auth-register-alt.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                    Register-alt
                  </a>
                </li>
                <li className="nav-item relative block">
                  <a href="auth-recover-pw.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                    Re-Password
                  </a>
                </li>
                <li className="nav-item relative block">
                  <a href="auth-recover-pw-alt.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                    Re-Password-alt
                  </a>
                </li>
                <li className="nav-item relative block">
                  <a href="auth-lock-screen.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                    Lock Screen
                  </a>
                </li>
                <li className="nav-item relative block">
                  <a href="auth-lock-screen-alt.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                    Lock Screen-alt
                  </a>
                </li>
                <li className="nav-item relative block">
                  <a href="auth-404.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                    Error 404
                  </a>
                </li>
                <li className="nav-item relative block">
                  <a href="auth-404-alt.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                    Error 404-alt
                  </a>
                </li>
                <li className="nav-item relative block">
                  <a href="auth-500.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                    Error 500
                  </a>
                </li>
                <li className="nav-item relative block">
                  <a href="auth-500-alt.html" className="nav-link hover:bg-gray-50 hover:text-primary-500 dark:hover:bg-gray-800/20 rounded-md dark:hover:text-primary-500 relative font-medium text-sm flex items-center h-[38px] decoration-0 px-2 py-4">
                    Error 500-alt
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
